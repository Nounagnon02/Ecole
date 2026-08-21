<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\{Eleve, Classes, Matieres};
use Illuminate\Support\Facades\Cache;

class DirecteurDashboardController extends Controller
{
    use DashboardHelpers;

    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classes::count(),
                // Profils enseignants scopés à l'école résolue. L'ancien compte
                // filtrait `users.role = 'enseignant'` sur `user->ecole_id` brut :
                // pour un super-admin (null), il renvoyait 0 enseignant même en
                // ciblant un établissement (cf. audit P3).
                'total_enseignants' => \App\Models\Enseignant::count(),
                // Compteurs plutôt que collections complètes : `with(['eleves',
                // 'enseignants'])` chargeait tout l'effectif de l'école (P3).
                'classes' => Classes::withCount(['eleves', 'enseignants'])->get(),
            ]
        ]);
    }

    /**
     * Endpoint consolidé pour le dashboard directeur
     * Retourne toutes les données en une seule requête avec cache de 5 minutes
     */
    public function getDashboardData()
    {
        // Cet endpoint expose le référentiel complet de l'école (élèves,
        // classes, matières). Il n'avait aucun contrôle de rôle : un élève ou
        // un parent pouvait le lire intégralement (cf. audit S8).
        if (!in_array(auth()->user()?->role, $this->directoryRoles(), true)) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $data = Cache::remember($this->directoryCacheKey(), 300, function () {
            // ─── KPI financiers du directeur (compteur, pas la compta) ───
            $revenusMois = (float) \App\Models\PaiementEleve::whereMonth('date_paiement', now()->month)
                ->whereYear('date_paiement', now()->year)
                ->where('statut_global', \App\Models\PaiementEleve::PAID)
                ->sum('montant');
            $depensesMois = (float) \App\Models\Depense::whereMonth('date_depense', now()->month)
                ->whereYear('date_depense', now()->year)
                ->sum('montant');
            $impayes = (float) \App\Models\PaiementEleve::where('montant_restant', '>', 0)
                ->sum('montant_restant');

            // ─── Assiduité (taux de présence du jour) ────────────────────
            $totalEleves = Eleve::count();
            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())
                ->where('type', 'absence')
                ->distinct('eleve_id')
                ->count('eleve_id');
            $tauxPresence = $totalEleves > 0
                ? max(0, 100 - (int) round(($absentsAujourdhui / $totalEleves) * 100))
                : 100;

            // ─── Alertes : incidents ouverts + sanctions du mois ─────────
            $incidentsOuverts = \App\Models\Incident::whereIn('statut', ['ouvert', 'en_cours'])->count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count();

            // ─── Messages récents adressés à l'établissement ─────────────
            $messagesRecents = \App\Models\Message::latest()
                ->take(5)
                ->get()
                ->map(fn ($m) => [
                    'id'        => $m->id,
                    'sujet'     => $m->sujet,
                    'expediteur'=> $m->expediteur ?? 'École',
                    'date'      => $m->created_at?->format('d/m/Y'),
                ]);

            return [
                'classes' => Classes::with('series')->get(),
                'classes_effectif' => Classes::withCount('eleves')->get()->map(function ($c) {
                    $c->effectif = $c->eleves_count;
                    return $c;
                }),
                'eleves' => Eleve::select('id', 'user_id', 'classe_id', 'numero_matricule', 'ecole_id')->get(),
                // `coefficient` vit sur le pivot serie_matieres et `code`
                // n'existe pas : le select d'origine levait une erreur SQL.
                'matieres' => Matieres::select('id', 'nom', 'ecole_id')->get(),
                'matieres_series' => Matieres::with('series')->get(),
                'series' => \App\Models\Series::with('matieres')->get(),
                'stats' => [
                    'total_eleves' => Eleve::count(),
                    'total_classes' => Classes::count(),
                    'total_enseignants' => \App\Models\Enseignant::count(),
                    'evolution_effectifs' => $this->computeMonthlyEnrollment(),
                    'repartition_notes' => $this->computeGradeDistribution(),
                ],
                'finances' => [
                    'revenus_mois' => $revenusMois,
                    'depenses_mois' => $depensesMois,
                    'impayes' => $impayes,
                ],
                'assiduite' => [
                    'taux_presence' => $tauxPresence,
                    'absents_aujourdhui' => $absentsAujourdhui,
                ],
                'alertes' => [
                    'incidents_ouverts' => $incidentsOuverts,
                    'sanctions_mois' => $sanctionsMois,
                ],
                'messages_recents' => $messagesRecents,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Invalide le cache du dashboard
     */
    public function invalidateCache()
    {
        // La clé doit être la même que celle utilisée en écriture : le
        // `forget('dashboard_directeur')` d'origine ne supprimait rien, et le
        // dashboard restait figé 5 minutes après chaque saisie (cf. audit P2).
        Cache::forget($this->directoryCacheKey());

        return response()->json(['success' => true, 'message' => 'Cache invalidé']);
    }

    private function computeMonthlyEnrollment(): array
    {
        // Tente de récupérer les inscriptions par mois depuis la base
        try {
            // L'année scolaire commence en septembre : la fenêtre doit courir de
            // septembre à août, pas sur l'année civile. L'ancien code croisait des
            // libellés scolaires avec `whereYear(now()->year)` : en janvier, les
            // inscriptions de septembre-décembre (même année scolaire) disparaissaient
            // du graphique, et le mois en cours portait l'étiquette « Sept » (audit P3).
            $now = now();
            $debutAnneeScolaire = $now->month >= 9
                ? $now->copy()->startOfMonth()->month(9)
                : $now->copy()->startOfMonth()->month(9)->subYear();

            // Regroupement en PHP plutôt que MONTH()/EXTRACT : portable entre
            // MySQL (production) et SQLite (tests).
            $eleves = \App\Models\Eleve::whereBetween('created_at', [
                $debutAnneeScolaire,
                $debutAnneeScolaire->copy()->addYear()->subSecond(),
            ])->pluck('created_at')
                ->countBy(fn ($d) => $d->month)
                ->all();

            $months = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'];

            return array_map(function ($i) use ($months, $eleves) {
                // Le mois scolaire i (0 = Sept) correspond au mois civil (9 + i) % 12.
                $moisCivil = ($i + 9) % 12;
                $moisCivil = $moisCivil === 0 ? 12 : $moisCivil;

                return [
                    'name' => $months[$i],
                    'students' => $eleves[$moisCivil] ?? 0,
                ];
            }, range(0, 11));
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return [
                ['name' => 'Aucune', 'students' => 0],
            ];
        }
    }

    private function computeGradeDistribution(): array
    {
        try {
            $excellent = \App\Models\Notes::where('note', '>=', 16)->count();
            $bien = \App\Models\Notes::whereBetween('note', [14, 15.99])->count();
            $moyen = \App\Models\Notes::whereBetween('note', [10, 13.99])->count();
            $insuffisant = \App\Models\Notes::where('note', '<', 10)->count();

            return [
                ['name' => 'Excellent', 'value' => $excellent ?: 0],
                ['name' => 'Bien', 'value' => $bien ?: 0],
                ['name' => 'Moyen', 'value' => $moyen ?: 0],
                ['name' => 'Insuffisant', 'value' => $insuffisant ?: 0],
            ];
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return [
                ['name' => 'Aucune donnée', 'value' => 0],
            ];
        }
    }
}
