<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class BibliothecaireDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Bibliothécaire — données réelles
     */
    public function bibliothecaire()
    {
        $data = Cache::remember('dashboard_bibliothecaire_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalLivres = \App\Models\Livre::count();
            $empruntsEnCours = \App\Models\Emprunt::whereNull('date_retour_effective')->count();
            $retards = \App\Models\Emprunt::whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', today())->count();
            // « Membres Actifs » = emprunteurs de la fenêtre d'activité (6 mois),
            // pas de toute l'histoire : l'ancien comptait un élève ayant emprunté
            // une fois il y a deux ans comme « actif » (cf. audit P3).
            $membresActifs = \App\Models\Emprunt::whereBetween('date_emprunt', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->distinct('eleve_id')->count('eleve_id');

            // Activité — 6 derniers mois (emprunts + retours), agrégée en SQL
            // (cf. audit P4). Les retours comptent par leur date de retour :
            // l'ancien code ne voyait que les retours d'ouvrages empruntés dans
            // la fenêtre, et perdait un livre rendu ce mois-ci après un emprunt
            // plus ancien.
            $empruntsParMois = \App\Models\Emprunt::whereBetween('date_emprunt', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_emprunt') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $retoursParMois = \App\Models\Emprunt::whereBetween('date_retour_effective', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_retour_effective') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $activite = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $activite[] = [
                    'mois' => $label,
                    'emprunts' => (int) ($empruntsParMois->get($cle, 0)),
                    'retours' => (int) ($retoursParMois->get($cle, 0)),
                ];
            }

            // Répartition par catégorie d'ouvrage (en %)
            $categories = \App\Models\Livre::select('categorie')
                ->get()->groupBy('categorie');
            $totalCategories = max($categories->flatten()->count(), 1);
            $repartitionCategories = $categories->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalCategories) * 100),
            ])->values();

            $derniersEmprunts = \App\Models\Emprunt::with(['eleve.user', 'eleve.classe', 'livre'])
                ->latest('date_emprunt')
                ->take(10)
                ->get()
                ->map(function ($e) {
                    $statut = $e->date_retour_effective
                        ? 'Retourné'
                        : ($e->date_retour_prevue?->lt(today()) ? 'En retard' : 'En cours');

                    return [
                        'id' => $e->id,
                        'eleve' => $this->nomEleve($e->eleve),
                        'classe' => $e->eleve?->classe?->nom_classe,
                        'ouvrage' => $e->livre?->titre,
                        'dateEmprunt' => $e->date_emprunt?->format('d/m/Y'),
                        'dateRetour' => $e->date_retour_prevue?->format('d/m/Y'),
                        'statut' => $statut,
                    ];
                });

            // ─── Retards nominatifs (le compteur ne dit pas quel ouvrage ni
            // quel élève), nouveautés au catalogue et ouvrages les plus lus.
            $retardsListe = \App\Models\Emprunt::with(['eleve.user', 'eleve.classe', 'livre'])
                ->whereNull('date_retour_effective')
                ->where('date_retour_prevue', '<', today())
                ->orderBy('date_retour_prevue')
                ->take(8)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'eleve' => $this->nomEleve($e->eleve),
                    'classe' => $e->eleve?->classe?->nom_classe,
                    'ouvrage' => $e->livre?->titre,
                    'dateRetour' => $e->date_retour_prevue?->format('d/m/Y'),
                    'jours_retard' => (int) today()->diffInDays($e->date_retour_prevue),
                ]);

            $nouveautes = \App\Models\Livre::latest('created_at')
                ->take(5)
                ->get()
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'titre' => $l->titre,
                    'auteur' => $l->auteur,
                    'categorie' => $l->categorie,
                ]);

            $populaires = \App\Models\Emprunt::select('livre_id', \DB::raw('COUNT(*) as emprunts'))
                ->with('livre')
                ->groupBy('livre_id')
                ->orderByDesc('emprunts')
                ->limit(5)
                ->get()
                ->map(fn ($row) => [
                    'titre' => $row->livre?->titre ?? 'Inconnu',
                    'emprunts' => $row->emprunts,
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Ouvrages', 'value' => (string) $totalLivres, 'trend' => 0, 'trendLabel' => 'au catalogue'],
                    ['title' => 'Emprunts en Cours', 'value' => (string) $empruntsEnCours, 'trend' => 0],
                    ['title' => 'Retards', 'value' => (string) $retards, 'trend' => 0],
                    ['title' => 'Membres Actifs', 'value' => (string) $membresActifs, 'trend' => 0, 'trendLabel' => 'emprunteurs'],
                ],
                'activite' => $activite,
                'categories' => $repartitionCategories,
                'emprunts' => $derniersEmprunts,
                'retards_liste' => $retardsListe,
                'nouveautes' => $nouveautes,
                'populaires' => $populaires,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
