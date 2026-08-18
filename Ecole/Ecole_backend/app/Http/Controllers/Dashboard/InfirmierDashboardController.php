<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class InfirmierDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Infirmier — données réelles
     */
    public function infirmier()
    {
        $data = Cache::remember('dashboard_infirmier_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 60, function () {
            // Le filtre année manquait sur ces deux compteurs : le même mois
            // était additionné sur toutes les années (cf. audit P3).
            $visitesMois = \App\Models\ConsultationMedicale::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $visitesAujourdhui = \App\Models\ConsultationMedicale::whereDate('date', today())->count();
            $casUrgents = \App\Models\ConsultationMedicale::where('urgence', true)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();
            $consultations = \App\Models\ConsultationMedicale::count();

            // Fréquentation — 6 derniers mois (visites + urgences), agrégée en
            // SQL (cf. audit P4).
            $visitesParMois = \App\Models\ConsultationMedicale::whereBetween('date', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw(
                $this->monthExpression('date') . ' as mois, '
                . 'COUNT(*) as visites, '
                . 'SUM(CASE WHEN urgence = 1 THEN 1 ELSE 0 END) as urgences'
            )->groupBy('mois')->get()->keyBy('mois');

            $frequentation = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $ligne = $visitesParMois->get($cle);
                $frequentation[] = [
                    'mois' => $label,
                    'visites' => (int) ($ligne->visites ?? 0),
                    'urgences' => (int) ($ligne->urgences ?? 0),
                ];
            }

            // Motifs les plus fréquents — 5 derniers ce mois-ci
            $motifs = \App\Models\ConsultationMedicale::select('motif')
                ->whereMonth('date', now()->month)
                ->selectRaw('COUNT(*) as total')
                ->groupBy('motif')
                ->orderByDesc('total')
                ->take(5)
                ->get()
                ->map(fn ($m) => ['motif' => $m->motif, 'count' => $m->total]);

            $dernieresVisites = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->latest('date')
                ->take(10)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'motif' => $c->motif,
                    'soin' => $c->traitement,
                    'statut' => $c->traitement ? 'Traité' : 'En cours',
                    'heure' => $c->date?->format('H:i'),
                ]);

            // ─── Cas urgents du jour (liste prioritaire, pas seulement un
            // compteur), alertes médicales portées par le dossier et élèves
            // suivis de façon récurrente.
            $urgencesJour = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->whereDate('date', today())
                ->where('urgence', true)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'motif' => $c->motif,
                    'heure' => $c->date?->format('H:i'),
                ]);

            $alertesMedicales = \App\Models\DossierMedical::with('eleve.user', 'eleve.classe')
                ->where(function ($q) {
                    $q->whereNotNull('allergies')->where('allergies', '!=', '')
                        ->orWhereNotNull('maladies_chroniques')->where('maladies_chroniques', '!=', '');
                })
                ->take(8)
                ->get()
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'eleve' => $this->nomEleve($d->eleve),
                    'classe' => $d->eleve?->classe?->nom_classe,
                    'allergies' => $d->allergies,
                    'maladie' => $d->maladies_chroniques,
                ]);

            $soinsRecurrents = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->get()
                ->groupBy('eleve_id')
                ->filter(fn ($g) => $g->count() >= 2)
                ->map(fn ($g) => [
                    'eleve' => $this->nomEleve($g->first()->eleve),
                    'classe' => $g->first()->eleve?->classe?->nom_classe,
                    'visites' => $g->count(),
                    'dernier_motif' => $g->last()->motif,
                ])->sortByDesc('visites')->take(5)->values();

            return [
                'stats' => [
                    ['title' => 'Visites du Mois', 'value' => (string) $visitesMois, 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'En Cours', 'value' => (string) $visitesAujourdhui, 'trend' => 0, 'trendLabel' => 'aujourd\'hui'],
                    ['title' => 'Cas Urgents', 'value' => (string) $casUrgents, 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Consultations', 'value' => (string) $consultations, 'trend' => 0, 'trendLabel' => 'total'],
                ],
                'frequentation' => $frequentation,
                'motifs' => $motifs,
                'visites' => $dernieresVisites,
                'urgences_jour' => $urgencesJour,
                'alertes_medicales' => $alertesMedicales,
                'soins_recurrents' => $soinsRecurrents,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
