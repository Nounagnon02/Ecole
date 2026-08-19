<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class CenseurDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Censeur — données réelles
     */
    public function censeur()
    {
        $data = Cache::remember('dashboard_censeur_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalEleves = \App\Models\Eleve::count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $absencesNonJustifiees = \App\Models\Absence::where('justifiee', false)
                ->where('type', 'absence')
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $avertissements = \App\Models\Sanction::where('type_sanction', 'like', '%Avertissement%')
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();

            // Évolution disciplinaire — 6 derniers mois (sanctions + avertissements),
            // agrégée en SQL (cf. audit P4).
            $sanctionsParMois = \App\Models\Sanction::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $avertissementsParMois = \App\Models\Sanction::where('type_sanction', 'like', '%Avertissement%')
                ->whereBetween('date', [
                    now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
                ])->selectRaw($this->monthExpression('date') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $evolution = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $evolution[] = [
                    'mois' => $label,
                    'sanctions' => (int) ($sanctionsParMois->get($cle, 0)),
                    'avertissements' => (int) ($avertissementsParMois->get($cle, 0)),
                ];
            }

            // Répartition par type de sanction (en %)
            $types = \App\Models\Sanction::select('type_sanction')->get()->groupBy('type_sanction');
            $totalTypes = max($types->flatten()->count(), 1);
            $typesSanctions = $types->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalTypes) * 100),
            ])->values();

            $statutsFR = [
                'active' => 'En cours',
                'terminee' => 'Exécuté',
                'levee' => 'Levée',
            ];

            $dernieresSanctions = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->latest('date')
                ->take(10)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'eleve' => $this->nomEleve($s->eleve),
                    'classe' => $s->eleve?->classe?->nom_classe,
                    'motif' => $s->motif,
                    'sanction' => $s->type_sanction,
                    'date' => $s->date?->format('d/m/Y'),
                    'statut' => $statutsFR[$s->statut] ?? 'En cours',
                ]);

            // ─── Absences non justifiées par classe ce mois-ci (drill-down
            // pour cibler les classes à problème).
            $absencesParClasse = \App\Models\Absence::with('eleve.classe')
                ->where('type', 'absence')
                ->where('justifiee', false)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->get()
                ->groupBy(fn ($a) => $a->eleve?->classe?->nom_classe ?? 'Sans classe')
                ->map(fn ($g, $nom) => [
                    'name' => $nom,
                    'absences' => $g->count(),
                ])->sortByDesc('absences')->values();

            // ─── Sanctions encore à exécuter (à notifier / suivre).
            $sanctionsAttente = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->whereNotIn('statut', ['terminee', 'levee'])
                ->latest('date')
                ->take(5)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'eleve' => $this->nomEleve($s->eleve),
                    'classe' => $s->eleve?->classe?->nom_classe,
                    'sanction' => $s->type_sanction,
                    'date' => $s->date?->format('d/m/Y'),
                    'statut' => $statutsFR[$s->statut] ?? 'En cours',
                ]);

            // ─── Récidivistes : élèves ayant reçu au moins deux sanctions.
            $recidivistes = \App\Models\Sanction::select('eleve_id', \DB::raw('COUNT(*) as sanctions'))
                ->with(['eleve.user', 'eleve.classe'])
                ->groupBy('eleve_id')
                ->having('sanctions', '>=', 2)
                ->orderByDesc('sanctions')
                ->limit(5)
                ->get()
                ->map(fn ($row) => [
                    'eleve' => $this->nomEleve($row->eleve),
                    'classe' => $row->eleve?->classe?->nom_classe,
                    'sanctions' => $row->sanctions,
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves, 'trend' => 0],
                    ['title' => 'Sanctions du Mois', 'value' => (string) $sanctionsMois, 'trend' => 0],
                    ['title' => 'Absences Non Justifiées', 'value' => (string) $absencesNonJustifiees, 'trend' => 0],
                    ['title' => 'Avertissements', 'value' => (string) $avertissements, 'trend' => 0],
                ],
                'evolution' => $evolution,
                'types_sanctions' => $typesSanctions,
                'sanctions' => $dernieresSanctions,
                'absences_par_classe' => $absencesParClasse,
                'sanctions_attente' => $sanctionsAttente,
                'recidivistes' => $recidivistes,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
