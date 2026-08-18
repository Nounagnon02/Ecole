<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Support\CalendrierOfficiel;
use Illuminate\Http\Request;

class ParentDashboardController extends Controller
{
    use DashboardHelpers;

    public function parent(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'parent') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => ['parent' => $user, 'enfants' => [], 'children' => [], 'stats' => [], 'evolution' => [], 'communications' => []]]);
        }

        // `user` doit être préchargé : il est lu dans le map ci-dessous, ce qui
        // déclenchait une requête par enfant (cf. audit P4).
        $children = $parent->eleves()->with(['user:id,name,prenom', 'classe', 'notes.matiere'])->get();

        // Rangs : une requête par classe distincte, partagée par tous ses élèves.
        $rangsParClasse = $children->pluck('classe_id')
            ->filter()
            ->unique()
            ->mapWithKeys(fn ($classeId) => [$classeId => \App\Models\Eleve::classRanks($classeId)]);

        $enfants = $children->map(function ($child) use ($rangsParClasse) {
            $moyenne = $this->calculateAverage($child->notes);

            return [
                'id'           => $child->id,
                'nom'          => $child->user->name ?? 'N/A',
                'prenom'       => $child->user->prenom ?? '',
                'matricule'    => $child->numero_matricule ?? 'N/A',
                'classe'       => $child->classe->nom_classe ?? $child->classe->nom ?? 'N/A',
                'classe_id'    => $child->classe_id,
                'moyenne'      => $moyenne !== null ? round($moyenne, 2) : null,
                'rang'         => $rangsParClasse[$child->classe_id][$child->id] ?? null,
                // Filiation enrichie (point B) : rôle du parent, contact de
                // référence (`is_primary`), tuteur légal.
                'role'         => $child->pivot?->role ?? null,
                'is_primary'   => (bool) ($child->pivot?->is_primary ?? false),
                'is_guardian'  => (bool) ($child->pivot?->is_guardian ?? false),
                'filiation'    => [
                    'role'        => $child->pivot?->role ?? null,
                    'is_primary'  => (bool) ($child->pivot?->is_primary ?? false),
                    'is_guardian' => (bool) ($child->pivot?->is_guardian ?? false),
                ],
            ];
        });

        // ─── Stats ──────────────────────────────────────────────────
        $moyenneGenerale = $enfants->pluck('moyenne')->filter()->avg();
        $absencesMois = $children->isNotEmpty()
            ? \App\Models\Absence::whereIn('eleve_id', $children->pluck('id'))
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->count()
            : 0;
        // Assiduité rapportée au nombre réel de jours de classe du mois
        // (calendrier officiel : jours ouvrés moins jours fériés), au lieu de
        // la division arbitraire par 22 jours. Hors période de classe (vacances
        // de juillet/août) la référence est nulle → assiduité indéterminée.
        $joursScolaires = CalendrierOfficiel::joursScolairesDuMois(now()->year, now()->month);
        $assiduite = $children->isNotEmpty() && $joursScolaires > 0
            ? max(0, 100 - (int) round(($absencesMois / ($children->count() * $joursScolaires)) * 100))
            : null;
        $solde = \App\Models\PaiementEleve::whereIn('eleve_id', $children->pluck('id'))
            ->where('montant_restant', '>', 0)
            ->sum('montant_restant');

        $stats = [
            ['title' => 'Enfants Scolarisés', 'value' => $children->count()],
            ['title' => 'Moyenne Générale', 'value' => $moyenneGenerale !== null ? round($moyenneGenerale, 2) : '—'],
            ['title' => 'Assiduité', 'value' => $assiduite !== null ? $assiduite . '%' : '—'],
            ['title' => 'Solde', 'value' => $solde > 0 ? number_format($solde, 0, ',', ' ') . ' FCFA' : '0 FCFA'],
        ];

        // ─── Évolution des notes (6 derniers mois, par enfant) ───────
        $evolution = $this->parentEvolution($children);

        // ─── Communications récentes adressées au parent ─────────────
        $communications = Message::where(function ($q) use ($user) {
            $q->where('destinataire', $user->name)
                ->orWhere('destinataire', $user->email)
                ->orWhere('destinataire', $user->identifiant ?? '');
        })
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($msg) => [
                'id'      => $msg->id,
                'from'    => $msg->expediteur ?? 'École',
                'role'    => 'École',
                'sujet'   => $msg->sujet,
                'date'    => $msg->created_at?->format('d/m/Y'),
                'urgent'  => false,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'parent'         => $user,
                // Contrat frontend (cf. C4) : `enfants` est la clé attendue,
                // `children` reste en alias pour l'application mobile.
                'enfants'        => $enfants,
                'children'       => $children->map(function ($child) use ($rangsParClasse) {
                    return [
                        'id'      => $child->id,
                        'name'    => $child->user->name ?? 'N/A',
                        'class'   => $child->classe->nom_classe ?? 'N/A',
                        'matricule' => $child->numero_matricule ?? 'N/A',
                        'role'    => $child->pivot?->role ?? null,
                        'is_primary'  => (bool) ($child->pivot?->is_primary ?? false),
                        'is_guardian' => (bool) ($child->pivot?->is_guardian ?? false),
                        'moyenne_generale' => $this->calculateAverage($child->notes),
                        'rang'    => $rangsParClasse[$child->classe_id][$child->id] ?? null,
                    ];
                }),
                'stats'          => $stats,
                'evolution'      => $evolution,
                'communications' => $communications,
            ],
        ]);
    }
}
