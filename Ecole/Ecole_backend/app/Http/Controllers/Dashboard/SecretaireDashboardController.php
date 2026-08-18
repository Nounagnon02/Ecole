<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class SecretaireDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Secrétaire — données réelles
     */
    public function secretaire()
    {
        $data = Cache::remember('dashboard_secretaire_' . (\App\Models\Eleve::currentEcoleId() ?? 'global'), 120, function () {
            $totalInscriptions = \App\Models\Eleve::count();
            // Filtre année manquant : le même mois était additionné sur toutes
            // les années (cf. audit P3).
            $nouveauxMois = \App\Models\Eleve::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->count();
            $dossiersEnCours = \App\Models\Certificat::where('delivre', false)->count();
            $documentsGeneres = \App\Models\Certificat::where('delivre', true)->count();

            // Flux d'inscriptions — 6 derniers mois, agrégé en SQL (cf. audit
            // P4). `transferts` a été retiré : aucune table, colonne ni signal ne
            // porte cette donnée (le statut élève ne connaît que actif/inactif,
            // cf. migration enrolment). Un `transferts => 0` codé en dur affichait
            // un faux compteur (audit P3).
            $nouveauxParMois = \App\Models\Eleve::whereBetween('created_at', [
                now()->startOfMonth()->subMonths(5), now()->endOfMonth(),
            ])->selectRaw($this->monthExpression('created_at') . ' as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->pluck('total', 'mois');

            $fluxInscriptions = [];
            foreach ($this->sixDerniersMois() as $cle => $label) {
                $fluxInscriptions[] = [
                    'mois' => $label,
                    'nouveaux' => (int) ($nouveauxParMois->get($cle, 0)),
                ];
            }

            $statutsFR = [
                'programmé' => 'Programmé',
                'confirmé' => 'Confirmé',
                'annulé' => 'Annulé',
            ];

            $rendezVous = \App\Models\RendezVous::with(['parent.user', 'eleve.user', 'enseignant.user'])
                ->whereDate('date', today())
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($r) {
                    $visiteur = $r->parent?->user
                        ?? $r->eleve?->user
                        ?? $r->enseignant?->user;

                    $statutsFR = ['programmé' => 'Programmé', 'confirmé' => 'Confirmé', 'annulé' => 'Annulé'];

                    return [
                        'id' => $r->id,
                        'visiteur' => trim(($visiteur?->name ?? '') . ' ' . ($visiteur?->prenom ?? '')) ?: 'Visiteur',
                        'motif' => $r->motif,
                        'heure' => $r->heure,
                        'statut' => $statutsFR[$r->statut] ?? $r->statut,
                    ];
                });

            $dernieresInscriptions = \App\Models\Eleve::with(['user', 'classe'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'nom' => trim(($e->user?->name ?? '') . ' ' . ($e->user?->prenom ?? '')),
                    'classe' => $e->classe?->nom_classe,
                    'type' => $e->created_at?->gte(now()->startOfMonth()) ? 'Nouveau' : 'Régulier',
                    'date' => $e->created_at?->format('d/m/Y'),
                    'statut' => 'Complété',
                ]);

            // ─── Planning complet des 7 prochains jours (le « Rendez-vous du
            // jour » ne montrait que la journée) et certificats à délivrer.
            $planningRendezVous = \App\Models\RendezVous::with(['parent.user', 'eleve.user', 'enseignant.user'])
                ->whereBetween('date', [today(), today()->addDays(6)])
                ->whereNotIn('statut', ['annulé', 'annule'])
                ->orderBy('date')
                ->orderBy('heure')
                ->take(12)
                ->get()
                ->map(function ($r) {
                    $visiteur = $r->parent?->user
                        ?? $r->eleve?->user
                        ?? $r->enseignant?->user;

                    return [
                        'id' => $r->id,
                        'visiteur' => trim(($visiteur?->name ?? '') . ' ' . ($visiteur?->prenom ?? '')) ?: 'Visiteur',
                        'motif' => $r->motif,
                        'date' => $r->date?->format('d/m'),
                        'heure' => $r->heure,
                        'statut' => $statutsFR[$r->statut] ?? $r->statut,
                    ];
                });

            $certificatsAttente = \App\Models\Certificat::with(['eleve.user', 'eleve.classe'])
                ->where('delivre', false)
                ->latest('date_emission')
                ->take(8)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'eleve' => $this->nomEleve($c->eleve),
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'type' => $c->type_certificat,
                    'date' => $c->date_emission?->format('d/m/Y') ?? '—',
                ]);

            return [
                'stats' => [
                    ['title' => 'Inscriptions', 'value' => (string) $totalInscriptions, 'trend' => 0, 'trendLabel' => 'total'],
                    ['title' => 'Nouveaux ce Mois', 'value' => (string) $nouveauxMois, 'trend' => 0],
                    ['title' => 'Dossiers en Cours', 'value' => (string) $dossiersEnCours, 'trend' => 0, 'trendLabel' => 'certificats'],
                    ['title' => 'Documents Générés', 'value' => (string) $documentsGeneres, 'trend' => 0, 'trendLabel' => 'émis'],
                ],
                'flux_inscriptions' => $fluxInscriptions,
                'rendez_vous' => $rendezVous,
                'inscriptions' => $dernieresInscriptions,
                'planning_rendez_vous' => $planningRendezVous,
                'certificats_attente' => $certificatsAttente,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
