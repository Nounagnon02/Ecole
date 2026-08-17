<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EnseignantDashboardController extends Controller
{
    use DashboardHelpers;

    public function enseignant(Request $request)
    {
        $enseignant = $request->user()->enseignant;

        if (!$enseignant) {
            return response()->json(['success' => false, 'message' => 'Profil enseignant non trouvé'], 404);
        }

        // Classes et matières de l'enseignant (via le pivot enseignant_matiere)
        $classeIds = $enseignant->classes()->pluck('classes.id');
        $matiereIds = $enseignant->matieres()->pluck('matieres.id');

        // Effectif total = élèves des classes de l'enseignant (distinct)
        $totalEleves = $classeIds->isEmpty()
            ? 0
            : \App\Models\Eleve::whereIn('classe_id', $classeIds)->count();

        // Emploi du temps de la semaine : créneaux de l'enseignant, triés avec
        // aujourd'hui en tête (le front affiche `planning[0]` comme « Aujourd'hui »).
        $jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        $coursSemaine = \App\Models\EmploiDuTemps::with(['matiere:id,nom', 'classe:id,nom_classe'])
            ->where('enseignant_id', $enseignant->id)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get()
            ->groupBy('jour');

        $aujourdhui = $jours[now()->dayOfWeekIso - 1] ?? 'Lundi';
        $emploiTemps = $coursSemaine->keys()->contains($aujourdhui)
            ? collect([$aujourdhui])->merge($coursSemaine->keys()->filter(fn ($j) => $j !== $aujourdhui))
                ->mapWithKeys(fn ($j) => [$j => $coursSemaine->get($j)])
            : $coursSemaine;

        $emploiTemps = $emploiTemps->map(function ($cours, $jour) {
            return [
                'jour' => $jour,
                'cours' => $cours->map(function ($c) {
                    return [
                        'heure' => ($c->heure_debut?->format('H') ?? '') . 'h' . $c->heure_debut?->format('i'),
                        'fin'   => $c->heure_fin?->format('H:i'),
                        'matiere' => $c->matiere?->nom ?? '—',
                        'classe'  => $c->classe?->nom_classe ?? '—',
                        'salle'   => $c->salle,
                    ];
                })->values(),
            ];
        })->values();

        // Notes liées à l'enseignant via ses (classe, matière) — 10 dernières.
        $notes = \App\Models\Notes::with(['eleve.user:id,name,prenom', 'eleve.classe:id,nom_classe', 'matiere:id,nom'])
            ->whereIn('classe_id', $classeIds)
            ->whereIn('matiere_id', $matiereIds)
            ->latest('date_evaluation')
            ->take(10)
            ->get();

        $notesRecentees = $notes->map(function ($note) {
            return [
                'id'           => $note->id,
                'eleve'        => $this->nomEleve($note->eleve),
                'classe'       => $note->eleve?->classe?->nom_classe ?? '—',
                'matiere'      => $note->matiere?->nom ?? '—',
                'note'         => (float) $note->note,
                'date'         => $note->date_evaluation?->format('d/m/Y') ?? $note->created_at?->format('d/m/Y'),
                'appreciation' => $this->appreciationNote($note->note),
            ];
        });

        // Moyenne de classe : moyenne des notes saisies par l'enseignant
        // sur ses (classe, matière) — période en cours.
        $moyenneClasse = $notes->count() > 0 ? round($notes->avg('note'), 2) : null;

        // Devoirs à corriger : devoirs de l'enseignant dont l'échéance est
        // passée ou sans échéance, encore publiés.
        $devoirsACorriger = $classeIds->isEmpty()
            ? collect()
            : \App\Models\Devoir::with(['classe:id,nom_classe'])
                ->where('enseignant_id', $enseignant->id)
                ->whereIn('classe_id', $classeIds)
                ->where('publie', true)
                ->where(function ($q) {
                    $q->whereNull('date_limite')
                        ->orWhere('date_limite', '<=', now());
                })
                ->take(5)
                ->get();

        $devoirs = $devoirsACorriger->map(fn ($d) => [
            'id'     => $d->id,
            'titre'  => $d->titre,
            'classe' => $d->classe?->nom_classe ?? '—',
            'date'   => $d->date_limite?->format('d/m/Y') ?? '—',
            'etat'   => 'à préparer',
        ]);

        $coursSemaineCount = $coursSemaine->flatten(1)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    ['title' => 'Mes Élèves', 'value' => (string) $totalEleves, 'trend' => 0, 'trendLabel' => 'dans mes classes'],
                    ['title' => 'Cours Cette Semaine', 'value' => (string) $coursSemaineCount, 'trend' => 0, 'trendLabel' => 'créneaux planifiés'],
                    ['title' => 'Moyenne Classe', 'value' => $moyenneClasse !== null ? number_format($moyenneClasse, 2, ',', ' ') : '—', 'trend' => 0, 'trendLabel' => 'mes notes'],
                    ['title' => 'Devoirs à Corriger', 'value' => (string) $devoirs->count(), 'trend' => 0, 'trendLabel' => 'échéance atteinte'],
                ],
                'emploi_temps' => $emploiTemps,
                'devoirs' => $devoirs,
                'notes_recentes' => $notesRecentees,
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
            ],
        ]);
    }
}
