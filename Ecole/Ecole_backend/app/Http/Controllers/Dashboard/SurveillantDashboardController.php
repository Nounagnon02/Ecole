<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class SurveillantDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Surveillant — données réelles
     */
    public function surveillant()
    {
        $data = Cache::remember('dashboard_surveillant_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 60, function () {
            $totalEleves = \App\Models\Eleve::count();

            // Un élève absent compte une fois, même avec plusieurs lignes dans
            // la journée — l'ancien `count()` gonflait « Absents » et tirait
            // « Présents » vers le bas (cf. audit P3).
            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())
                ->where('type', 'absence')
                ->distinct('eleve_id')
                ->count('eleve_id');
            $presents = max($totalEleves - $absentsAujourdhui, 0);

            $alertes = \App\Models\Incident::whereIn('statut', ['ouvert', 'en_cours'])->count();

            // Présences de la semaine (lundi → dimanche), mêmes élèves distincts
            $joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            $absencesSemaine = \App\Models\Absence::where('type', 'absence')
                ->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
                ->get()
                ->groupBy(fn ($a) => $a->date?->format('Y-m-d'))
                ->map(fn ($jour) => $jour->pluck('eleve_id')->unique()->count());

            $presencesSemaine = [];
            foreach (range(0, 6) as $i) {
                $jour = now()->startOfWeek()->addDays($i)->format('Y-m-d');
                $absentsJour = $absencesSemaine->get($jour) ?? 0;
                $presencesSemaine[] = [
                    'jour' => $joursSemaine[$i],
                    'presents' => max($totalEleves - $absentsJour, 0),
                    'absents' => $absentsJour,
                ];
            }

            // Points de surveillance : une zone par cycle réellement présent.
            // Une seule agrégation pour toutes les zones, au lieu d'un comptage
            // d'enseignants par catégorie (N+1, cf. audit P4) — les deux requêtes
            // restent scopées à l'école résolue.
            $personnelsParCategorie = \App\Models\Enseignant::with('classes:id,categorie_classe')
                ->get()
                ->flatMap(fn ($e) => $e->classes->pluck('categorie_classe'))
                ->countBy()
                ->all();

            $points = \App\Models\Classes::select('categorie_classe')
                ->distinct()
                ->get()
                ->map(function ($classe) use ($personnelsParCategorie) {
                    $personnels = $personnelsParCategorie[$classe->categorie_classe] ?? 0;

                    return [
                        'zone' => $classe->categorie_classe,
                        'personnels' => $personnels,
                        'etat' => $personnels > 0 ? 'Actif' : 'Inactif',
                    ];
                })->values();

            $derniersRetards = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->where('type', 'retard')
                ->latest('date')
                ->take(10)
                ->get();

            // Récurrence (≥ 2 retards sur 30 jours) en une seule requête
            // d'agrégation, au lieu d'un comptage par retard (N+1, cf. audit P4).
            $eleveIds = $derniersRetards->pluck('eleve_id')->filter()->unique()->values();
            $retardsParEleve = \App\Models\Absence::where('type', 'retard')
                ->where('date', '>=', now()->subDays(30))
                ->whereIn('eleve_id', $eleveIds)
                ->selectRaw('eleve_id, COUNT(*) as total')
                ->groupBy('eleve_id')
                ->pluck('total', 'eleve_id');

            $derniersRetards = $derniersRetards->map(function ($a) use ($retardsParEleve) {
                return [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'temps' => $a->date?->format('d/m/Y'),
                    'motif' => $a->motif,
                    'recurrent' => (int) ($retardsParEleve[$a->eleve_id] ?? 0) >= 2,
                ];
            });

            // ─── Liste nominative des absents du jour (le compteur seul ne
            // permet pas d'agir), incidents ouverts et absences non justifiées.
            $absentsJour = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->whereDate('date', today())
                ->where('type', 'absence')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'motif' => $a->motif,
                    'justifiee' => (bool) $a->justifiee,
                ]);

            $gravitesFR = ['mineure' => 'Mineure', 'moyenne' => 'Moyenne', 'majeure' => 'Majeure'];
            $incidents = \App\Models\Incident::latest('date')
                ->take(5)
                ->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'description' => $i->description,
                    'date' => $i->date?->format('d/m/Y'),
                    'gravite' => $gravitesFR[$i->gravite] ?? $i->gravite,
                    'statut' => $i->statut,
                ]);

            $absencesNonJustifiees = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->where('type', 'absence')
                ->where('justifiee', false)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'eleve' => $this->nomEleve($a->eleve),
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'date' => $a->date?->format('d/m/Y'),
                    'motif' => $a->motif,
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves, 'trend' => 0],
                    ['title' => 'Présents Aujourd\'hui', 'value' => (string) $presents, 'trend' => 0],
                    ['title' => 'Absents', 'value' => (string) $absentsAujourdhui, 'trend' => 0],
                    ['title' => 'Alertes', 'value' => (string) $alertes, 'trend' => 0],
                ],
                'presences_semaine' => $presencesSemaine,
                'points_surveillance' => $points,
                'retards' => $derniersRetards,
                'absents_jour' => $absentsJour,
                'incidents' => $incidents,
                'absences_non_justifiees' => $absencesNonJustifiees,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
