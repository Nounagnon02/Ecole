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
            try {
            $moisActuel = now()->month;
            $anneeActuelle = now()->year;

            // Encaissé du mois : versements approuvés (caisse) et paiements en
            // ligne confirmés, comme pour le directeur (R-26). Les échéances
            // soldées seules, lues dans `montant`, ignoraient tout versement
            // partiel (R-41, 16/11/2026).
            $debutMois = now()->startOfMonth();
            $finMois = now()->endOfMonth();
            $revenusMois = (float) \App\Models\TransactionPaiement::where('statut', \App\Models\TransactionPaiement::APPROUVE)
                ->whereBetween('date_paiement', [$debutMois, $finMois])->sum('montant_paye')
                + (float) \App\Models\Payment::where('status', 'completed')
                ->whereBetween('paid_at', [$debutMois, $finMois])->sum('amount');

            $enAttente = \App\Models\PaiementEleve::whereIn('statut_global', [
                \App\Models\PaiementEleve::PENDING,
                \App\Models\PaiementEleve::PARTIAL,
            ])->count();

            // Part des MONTANTS dus déjà payés, sur toutes les échéances : la
            // même mesure que la page Factures. L'ancienne part de LIGNES
            // soldées du mois donnait 35 % quand Factures affichait 68 % (R-41).
            $du = (float) \App\Models\PaiementEleve::sum('montant_total');
            $paye = (float) \App\Models\PaiementEleve::sum('montant_paye');
            $tauxRecouvrement = $du > 0 ? round(($paye / $du) * 100) . '%' : '—';

            $depensesMois = (float) \App\Models\Depense::whereMonth('date_depense', $moisActuel)
                ->whereYear('date_depense', $anneeActuelle)->sum('montant');

            // Évolution des finances — 6 derniers mois (revenus + dépenses),
            // agrégée en SQL (cf. audit P4) : l'ancien code chargeait toutes les
            // lignes de la fenêtre puis les regroupait en PHP.
            $fenetre = [now()->startOfMonth()->subMonths(5), now()->endOfMonth()];
            $enCaisse = \App\Models\TransactionPaiement::where('statut', \App\Models\TransactionPaiement::APPROUVE)
                ->whereBetween('date_paiement', $fenetre)
                ->selectRaw($this->monthExpression('date_paiement') . ' as mois, SUM(montant_paye) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');
            $enLigne = \App\Models\Payment::where('status', 'completed')
                ->whereBetween('paid_at', $fenetre)
                ->selectRaw($this->monthExpression('paid_at') . ' as mois, SUM(amount) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');
            $revenusParMois = $enCaisse->keys()->merge($enLigne->keys())->unique()
                ->mapWithKeys(fn ($mois) => [$mois => (float) $enCaisse->get($mois, 0) + (float) $enLigne->get($mois, 0)]);

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
            $typesRows = \App\Models\PaiementEleve::select('type_paiement', \DB::raw('COUNT(*) as total'))
                ->whereNotNull('type_paiement')
                ->groupBy('type_paiement')
                ->get();

            $totalTypes = max($typesRows->sum('total'), 1);
            $repartition = $typesRows->map(fn ($row) => [
                'name' => $row->type_paiement,
                'value' => round(($row->total / $totalTypes) * 100),
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
            // Même mesure que « Revenus du mois » : le cumul payé des échéances
            // touchées ce mois mêlait les versements des mois précédents (R-41).
            $encaissementsMois = $revenusMois;

            // ─── Répartition des revenus par type (part du montant, pas du
            // nombre de lignes comme `repartition`).
            $montantRows = \App\Models\PaiementEleve::select('type_paiement', \DB::raw('SUM(montant_paye) as total_montant'))
                ->whereNotNull('type_paiement')
                ->groupBy('type_paiement')
                ->get();
            $totalMontant = max($montantRows->sum('total_montant'), 1);
            $repartitionRevenus = $montantRows->map(fn ($row) => [
                'name' => $row->type_paiement,
                'value' => round(((float) $row->total_montant / $totalMontant) * 100),
            ])->values();

            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => number_format($revenusMois, 0, ',', ' ') . ' F', 'trendLabel' => 'ce mois'],
                    ['title' => 'Factures en Attente', 'value' => (string) $enAttente, 'trendLabel' => 'non soldées'],
                    ['title' => 'Taux Recouvrement', 'value' => $tauxRecouvrement, 'trendLabel' => 'des montants dus'],
                    ['title' => 'Dépenses du Mois', 'value' => number_format($depensesMois, 0, ',', ' ') . ' F', 'trendLabel' => 'ce mois'],
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
            } catch (\Exception $e) {
                \Log::error('Dashboard Comptable error: ' . $e->getMessage());
                return [
                    'stats' => [
                        ['title' => 'Revenus du Mois', 'value' => '0 F', 'trendLabel' => 'ce mois'],
                        ['title' => 'Factures en Attente', 'value' => '0', 'trendLabel' => 'non soldées'],
                        ['title' => 'Taux Recouvrement', 'value' => '—', 'trendLabel' => 'ce mois'],
                        ['title' => 'Dépenses du Mois', 'value' => '0 F', 'trendLabel' => 'ce mois'],
                    ],
                    'donnes_ca' => [],
                    'repartition' => [],
                    'repartition_revenus' => [],
                    'factures' => [],
                    'impayes' => [],
                    'tresorerie' => [
                        'encaissements_mois' => 0,
                        'depenses_mois' => 0,
                        'solde' => 0,
                    ],
                ];
            }
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
