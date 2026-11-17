<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Absence;
use App\Models\Classes;
use App\Models\Eleve;
use App\Models\EnseignantMatiere;
use App\Models\Notes;
use App\Models\Notification;
use App\Models\PaiementEleve;
use App\Support\AvisParents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * « Ce qui demande une décision » (recommandation D8 de l'audit).
 *
 * Le tableau de bord de la direction montrait des chiffres, pas des actions.
 * Trois listes, chacune avec sa relance :
 *  - impayés échus, par classe → SMS aux parents ;
 *  - affectations sans note saisie depuis 30 jours → notification à l'enseignant ;
 *  - absences non justifiées des 30 derniers jours, par élève → SMS aux parents.
 *
 * Les modèles lus sont cloisonnés par école et par cycle (scopes globaux) ;
 * les affectations, qui ne le sont pas, sont filtrées sur les classes visibles.
 * Une même relance ne part qu’une fois par jour (table `relances_direction`) :
 * un double clic ne double pas les SMS.
 */
class DecisionsController extends Controller
{
    private const JOURS = 30;

    public function index(): JsonResponse
    {
        return response()->json([
            'impayes' => $this->impayes()->values(),
            'notes_manquantes' => $this->notesManquantes()->values(),
            'absences' => $this->absences()->values(),
        ]);
    }

    public function relancer(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'type' => 'required|in:impayes,notes,absences',
            'id' => 'required|integer',
        ]);

        // Résoudre la cible avant tout : une cible d'une autre école répond 404.
        $cible = match ($donnees['type']) {
            'impayes' => Classes::findOrFail($donnees['id']),
            'notes' => EnseignantMatiere::whereIn('classe_id', Classes::pluck('id'))
                ->with(['enseignant.user', 'matiere', 'classe'])->findOrFail($donnees['id']),
            'absences' => Eleve::with('user:id,name,prenom')->findOrFail($donnees['id']),
        };

        // Une relance par cible et par jour, garantie par la clé unique de la
        // table (pas par le cache, qui peut être `array` ou vidé).
        $relance = [
            'ecole_id' => $request->user()->ecole_id ?? $cible->ecole_id,
            'type' => $donnees['type'],
            'cible_id' => $donnees['id'],
            'jour' => now()->toDateString(),
        ];
        if (DB::table('relances_direction')->insertOrIgnore($relance + ['user_id' => $request->user()->id, 'created_at' => now(), 'updated_at' => now()]) === 0) {
            return response()->json(['message' => 'Déjà relancé aujourd’hui.'], 409);
        }

        $envoyes = match ($donnees['type']) {
            'impayes' => $this->relancerImpayes($cible),
            'notes' => $this->relancerEnseignant($cible),
            'absences' => $this->relancerAbsences($cible),
        };
        DB::table('relances_direction')->where($relance)->update(['envoyes' => $envoyes]);

        return response()->json(['envoyes' => $envoyes, 'message' => 'Relance envoyée.']);
    }

    /** Échéances dépassées avec un reste dû. */
    private function echues()
    {
        return PaiementEleve::where('montant_restant', '>', 0)
            ->whereDate('date_paiement', '<', now()->toDateString());
    }

    private function impayes(): Collection
    {
        $lignes = $this->echues()->with('eleve:id,classe_id')->get()
            ->filter(fn ($p) => $p->eleve?->classe_id)
            ->groupBy(fn ($p) => $p->eleve->classe_id);
        $noms = Classes::whereIn('id', $lignes->keys())->pluck('nom_classe', 'id');

        return $lignes->map(fn ($paiements, $classeId) => [
            'classe_id' => (int) $classeId,
            'classe' => $noms[$classeId] ?? '—',
            'eleves' => $paiements->pluck('eleve_id')->unique()->count(),
            'montant_du' => (float) $paiements->sum('montant_restant'),
        ])->filter(fn ($l) => isset($noms[$l['classe_id']]))->sortByDesc('montant_du');
    }

    private function notesManquantes(): Collection
    {
        $classes = Classes::pluck('id');
        $dernieres = Notes::whereIn('classe_id', $classes)
            ->selectRaw('classe_id, matiere_id, MAX(created_at) as derniere')
            ->groupBy('classe_id', 'matiere_id')->get()
            ->mapWithKeys(fn ($n) => [$n->classe_id.'-'.$n->matiere_id => $n->derniere]);
        $limite = now()->subDays(self::JOURS);

        return EnseignantMatiere::whereIn('classe_id', $classes)
            ->with(['enseignant.user:id,name,prenom', 'matiere:id,nom', 'classe:id,nom_classe'])->get()
            ->map(function ($a) use ($dernieres) {
                $derniere = $dernieres[$a->classe_id.'-'.$a->matiere_id] ?? null;

                return [
                    'affectation_id' => $a->id,
                    'enseignant_id' => $a->enseignant_id,
                    'enseignant' => trim(($a->enseignant?->user?->prenom ?? '').' '.($a->enseignant?->user?->name ?? '')) ?: '—',
                    'classe' => $a->classe?->nom_classe ?? '—',
                    'matiere' => $a->matiere?->nom ?? '—',
                    'derniere_note' => $derniere ? substr((string) $derniere, 0, 10) : null,
                ];
            })
            ->filter(fn ($l) => $l['derniere_note'] === null || $l['derniere_note'] < $limite->toDateString())
            ->sortBy('derniere_note');
    }

    private function nonJustifiees()
    {
        return Absence::where('justifiee', false)->whereDate('date', '>=', now()->subDays(self::JOURS)->toDateString());
    }

    private function absences(): Collection
    {
        return $this->nonJustifiees()->with(['eleve.user:id,name,prenom', 'eleve.classe:id,nom_classe'])->get()
            ->groupBy('eleve_id')
            ->map(fn ($liste, $eleveId) => [
                'eleve_id' => (int) $eleveId,
                'eleve' => trim(($liste->first()->eleve?->user?->prenom ?? '').' '.($liste->first()->eleve?->user?->name ?? '')) ?: '—',
                'classe' => $liste->first()->eleve?->classe?->nom_classe ?? '—',
                'absences' => $liste->count(),
                'depuis' => $liste->min('date')?->toDateString(),
            ])
            ->sortByDesc('absences');
    }

    /** Un SMS par élève de la classe : total dû et échéances dépassées. */
    private function relancerImpayes(Classes $classe): int
    {
        return $this->echues()->whereHas('eleve', fn ($q) => $q->where('classe_id', $classe->id))
            ->with('eleve.user:id,name,prenom')->get()->groupBy('eleve_id')
            ->sum(fn ($paiements) => AvisParents::envoyer($paiements->first()->eleve, 'retard', [
                'reste' => AvisParents::fcfa((float) $paiements->sum('montant_restant')),
                'libelle' => $paiements->pluck('type_paiement')->filter()->unique()->implode(', ') ?: 'scolarité',
                'date' => $paiements->min('date_paiement')->format('d/m/Y'),
            ]));
    }

    private function relancerEnseignant(EnseignantMatiere $affectation): int
    {
        $userId = $affectation->enseignant?->user_id;
        if (! $userId) {
            return 0;
        }
        $matiere = $affectation->matiere?->nom ?? 'votre matière';
        $classe = $affectation->classe?->nom_classe ?? 'votre classe';

        Notification::create([
            'user_id' => $userId,
            'type' => 'relance_notes',
            'title' => 'Notes à saisir',
            'message' => "La direction vous demande de saisir les notes de {$matiere} en {$classe} : aucune note depuis ".self::JOURS.' jours.',
            'data' => ['classe_id' => $affectation->classe_id, 'matiere_id' => $affectation->matiere_id],
            'ecole_id' => $affectation->ecole_id,
        ]);

        return 1;
    }

    private function relancerAbsences(Eleve $eleve): int
    {
        $nombre = $this->nonJustifiees()->where('eleve_id', $eleve->id)->count();

        return $nombre > 0 ? AvisParents::envoyer($eleve, 'absences_a_justifier', ['nombre' => $nombre]) : 0;
    }
}
