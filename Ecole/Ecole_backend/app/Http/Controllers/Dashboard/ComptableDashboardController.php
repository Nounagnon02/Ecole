<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class ComptableDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Comptable — données réelles
     */
    public function comptable()
    {
        $data = Cache::remember('dashboard_comptable_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $moisActuel = now()->month;
            $anneeActuelle = now()->year;

            $revenusMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->whereYear('date_paiement', $anneeActuelle)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->sum('montant');

            $enAttente = \App\Models\PaiementEleve::whereIn('statut_global', [
                \App\Models\PaiementEleve::PENDING,
                \App\Models\PaiementEleve::PARTIAL,
            ])->count();

            $totalPaiements = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)->count();
            $payes = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)->count();
            $tauxRecouvrement = $totalPaiements > 0 ? round(($payes / $totalPaiements) * 100) : 0;

            $depensesMois = (float) \App\Models\Depense::whereMonth('date_depense', $moisActuel)
                ->whereYear('date_depense', $anneeActuelle)->sum('montant');

            // Évolution des finances — 6 derniers mois (revenus + dépenses),
            // agrégée en SQL (cf. audit P4) : l'ancien code chargeait toutes les
            // lignes de la fenêtre puis les regroupait en PHP.
            $revenusParMois = \App\Models\PaiementEleve::whereBetween('date_paiement', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->selectRaw($this->monthExpression('date_paiement') . ' as mois, SUM(montant) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $depensesParMois = \App\Models\Depense::whereBetween('date_depense', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('date_depense') . ' as mois, SUM(montant) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $donneesMensuelles = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $donneesMensuelles[] = [
                    'mois' => $label,
                    'revenus' => (float) ($revenusParMois->get($cle, 0)),
                    'depenses' => (float) ($depensesParMois->get($cle, 0)),
                ];
            }

            // Répartition par type de paiement (en %)
            $types = \App\Models\PaiementEleve::select('type_paiement')
                ->whereNotNull('type_paiement')
                ->get()
                ->groupBy('type_paiement');

            $totalTypes = max($types->flatten()->count(), 1);
            $repartition = $types->map(fn ($g, $nom) => [
                'name' => $nom,
                'value' => round(($g->count() / $totalTypes) * 100),
            ])->values();

            $statutsFR = [
                \App\Models\PaiementEleve::PAID => 'Payée',
                \App\Models\PaiementEleve::PARTIAL => 'Partiel',
                \App\Models\PaiementEleve::PENDING => 'En attente',
            ];

            $dernieresPaiements = \App\Models\PaiementEleve::with(['eleve.user', 'eleve.classe'])
                ->latest('date_paiement')
                ->take(10)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'eleve' => $this->nomEleve($p->eleve),
                    'classe' => $p->eleve?->classe?->nom_classe,
                    'montant' => (float) $p->montant,
                    'statut' => $statutsFR[$p->statut_global] ?? 'En attente',
                    'echeance' => $p->date_paiement?->format('d/m/Y'),
                ]);

            // ─── Impayés : les comptes en cours de solde, les plus lourds en
            // premier — c'est la liste d'action prioritaire de la comptabilité.
            $impayes = \App\Models\PaiementEleve::with(['eleve.user', 'eleve.classe'])
                ->where('montant_restant', '>', 0)
                ->orderByDesc('montant_restant')
                ->take(8)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'eleve' => $this->nomEleve($p->eleve),
                    'classe' => $p->eleve?->classe?->nom_classe,
                    'montant_restant' => (float) $p->montant_restant,
                    'type' => $p->type_paiement ?? '—',
                ]);

            // ─── Trésorerie du mois : encaissé (réellement versé) − dépenses.
            $encaissementsMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->whereYear('date_paiement', $anneeActuelle)
                ->sum('montant_paye');

            // ─── Répartition des revenus par type (part du montant, pas du
            // nombre de lignes comme `repartition`).
            $montantParType = \App\Models\PaiementEleve::select('type_paiement')
                ->whereNotNull('type_paiement')
                ->get()
                ->groupBy('type_paiement')
                ->map(fn ($g) => (float) $g->sum('montant'));
            $totalMontant = max($montantParType->sum(), 1);
            $repartitionRevenus = $montantParType->map(fn ($montant, $nom) => [
                'name' => $nom,
                'value' => round(($montant / $totalMontant) * 100),
            ])->values();

            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => number_format($revenusMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Factures en Attente', 'value' => (string) $enAttente, 'trend' => 0, 'trendLabel' => 'non soldées'],
                    ['title' => 'Taux Recouvrement', 'value' => "{$tauxRecouvrement}%", 'trend' => 0, 'trendLabel' => 'ce mois'],
                    ['title' => 'Dépenses du Mois', 'value' => number_format($depensesMois, 0, ',', ' ') . ' F', 'trend' => 0, 'trendLabel' => 'ce mois'],
                ],
                'donnes_ca' => $donneesMensuelles,
                'repartition' => $repartition,
                'repartition_revenus' => $repartitionRevenus,
                'factures' => $dernieresPaiements,
                'impayes' => $impayes,
                'tresorerie' => [
                    'encaissements_mois' => $encaissementsMois,
                    'depenses_mois' => $depensesMois,
                    'solde' => $encaissementsMois - $depensesMois,
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
