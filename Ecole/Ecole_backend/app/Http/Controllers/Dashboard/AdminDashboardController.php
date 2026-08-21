<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class AdminDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Admin — données réelles
     */
    public function admin()
    {
        $ecoleId = \App\Models\Eleve::currentEcoleId() ?? 'global';

        $data = Cache::remember('dashboard_admin_' . $ecoleId, 120, function () {
            try {
            // ─── Utilisateurs & plateforme ───────────────────────────
            $totalEcoles = \App\Models\Ecole::count();
            $totalUsers = User::count();
            $activeUsers = User::where('is_active', true)->count();
            $tauxActivite = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100) : 0;

            $nouveautesSemaine = User::where('created_at', '>=', now()->subWeek())->count();
            $plansActifs = class_exists(\App\Models\SaaS\Plan::class) ? \App\Models\SaaS\Plan::where('is_active', true)->count() : 0;
            $modulesActifs = class_exists(\App\Models\SaaS\Module::class) ? \App\Models\SaaS\Module::where('is_active', true)->count() : 0;

            $revenus = 0;
            if (class_exists(\App\Models\Universite\Paiement::class)) {
                $revenus = \App\Models\Universite\Paiement::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('montant');
            }

            $repartitionRoles = User::selectRaw('role, COUNT(*) as total')
                ->groupBy('role')
                ->pluck('total', 'role')
                ->map(fn($v, $k) => ['name' => ucfirst($k), 'value' => $v])
                ->values();

            $activitesRecentes = collect();
            if (class_exists(\App\Models\AuditLog::class)) {
                $activitesRecentes = \App\Models\AuditLog::with('user')->latest()->take(10)->get()->map(function ($log) {
                    return [
                        'id'          => $log->id,
                        'type'        => $log->event ?? 'action',
                        'description' => $log->description ?? ($log->event . ' par ' . ($log->user->name ?? 'inconnu')),
                        'date'        => $log->created_at?->toISOString(),
                    ];
                });
            }

            // ─── Activité plateforme (7 derniers jours) ──────────────
            // Aucune table de journalisation HTTP n'existe ; on proxifie le
            // trafic par les actions auditées du jour (cf. audit P4).
            $traffic = collect(range(6, 0))->map(function ($offset) {
                $jour = now()->subDays($offset)->format('Y-m-d');
                $req = class_exists(\App\Models\AuditLog::class)
                    ? \App\Models\AuditLog::whereDate('created_at', $jour)->count()
                    : 0;
                return ['jour' => $jour, 'req' => $req];
            })->values();

            // ─── Santé système (valeurs réelles du serveur PHP) ──────
            $freeDisk  = function_exists('disk_free_space') ? disk_free_space(base_path()) : false;
            $totalDisk = function_exists('disk_total_space') ? disk_total_space(base_path()) : false;
            $diskUsage = ($freeDisk && $totalDisk) ? (int) round((1 - $freeDisk / $totalDisk) * 100) : 0;
            $diskLabel = ($freeDisk && $totalDisk) ? number_format($freeDisk / 1024 / 1024, 0, ',', ' ') . ' Mo libres' : '—';

            $memLimit = ini_get('memory_limit');
            $memPct = 0;
            if ($memLimit && strcasecmp($memLimit, '-1') !== 0) {
                $parsed = preg_replace_callback('/(\d+)([GMK])/i', function ($m) {
                    $mul = ['K' => 1024, 'M' => 1024 ** 2, 'G' => 1024 ** 3];
                    return $mul[strtoupper($m[2])] * $m[1];
                }, $memLimit);
                $memPct = $parsed > 0 ? (int) round((memory_get_usage(true) / $parsed) * 100) : 0;
            }

            $uptime = null;
            if (is_readable('/proc/uptime') && ($boot = (float) file_get_contents('/proc/uptime'))) {
                $uptime = floor($boot / 86400) . 'j ' . floor(($boot % 86400) / 3600) . 'h';
            }

            $health = [
                ['label' => 'Disque', 'value' => $diskUsage . '%', 'width' => $diskUsage . '%', 'color' => $diskUsage > 85 ? 'bg-[var(--red)]' : ($diskUsage > 70 ? 'bg-[var(--amber)]' : 'bg-[var(--accent)]')],
                ['label' => 'Mémoire PHP', 'value' => $memPct . '%', 'width' => $memPct . '%', 'color' => $memPct > 85 ? 'bg-[var(--red)]' : ($memPct > 70 ? 'bg-[var(--amber)]' : 'bg-[var(--emerald)]')],
                ['label' => 'Base de données', 'value' => 'connectée', 'width' => '100%', 'color' => 'bg-[var(--emerald)]'],
                ['label' => 'Uptime serveur', 'value' => $uptime ?? '—', 'width' => '100%', 'color' => 'bg-[var(--emerald)]'],
            ];

            // ─── Logs (dernières lignes réelles du journal Laravel) ───
            $logs = $this->tailLaravelLogs(6);
            $erreursApi = $this->countLogErrors();

            // ─── Utilisateurs récents ─────────────────────────────────
            $utilisateurs = User::with('ecole:id,nom')
                ->latest()
                ->take(8)
                ->get(['id', 'name', 'prenom', 'email', 'role', 'ecole_id', 'is_active', 'created_at'])
                ->map(function ($u) {
                    return [
                        'id'         => $u->id,
                        'name'       => trim($u->name . ' ' . $u->prenom),
                        'email'      => $u->email,
                        'role'       => $u->role,
                        'ecole'      => $u->ecole?->nom ?? '—',
                        'is_active'  => (bool) $u->is_active,
                        'created_at' => $u->created_at?->toIso8601String(),
                    ];
                });

            // L'endpoint lui-même apporte une réponse au trafic : le volume du
            // jour est incrémenté de cette requête.
            $traffic = $traffic->map(function ($t) {
                if ($t['jour'] === now()->format('Y-m-d')) {
                    $t['req'] += 1;
                }
                return $t;
            })->values();

            return [
                'stats' => [
                    ['title' => 'Utilisateurs Actifs', 'value' => number_format($activeUsers), 'trend' => $nouveautesSemaine, 'trendLabel' => 'nouveaux / 7j'],
                    ['title' => 'Espace Disque', 'value' => $diskUsage . '%', 'trend' => 0, 'trendLabel' => 'utilisé'],
                    ['title' => 'Erreurs API', 'value' => (string) $erreursApi, 'trend' => 0, 'trendLabel' => 'dans le journal'],
                    ['title' => 'Uptime', 'value' => $uptime ?? '—', 'trend' => 0, 'trendLabel' => 'serveur'],
                ],
                'traffic'         => $traffic,
                'health'          => $health,
                'logs'            => $logs,
                'utilisateurs'    => $utilisateurs,
                'repartition_roles' => $repartitionRoles,
                'ecoles'            => $totalEcoles,
                'utilisateurs_total' => $totalUsers,
                'taux_activite'     => $tauxActivite,
                'plans_actifs'      => $plansActifs,
                'modules_actifs'    => $modulesActifs,
                'revenus'           => $revenus,
                'nouveautes_semaine' => $nouveautesSemaine,
                'activites_recentes' => $activitesRecentes,
            ];
            } catch (\Exception $e) {
                \Log::error('Dashboard Admin error: ' . $e->getMessage());
                return [
                    'stats' => [
                        ['title' => 'Utilisateurs Actifs', 'value' => '0', 'trend' => 0, 'trendLabel' => 'nouveaux / 7j'],
                        ['title' => 'Espace Disque', 'value' => '0%', 'trend' => 0, 'trendLabel' => 'utilisé'],
                        ['title' => 'Erreurs API', 'value' => '0', 'trend' => 0, 'trendLabel' => 'dans le journal'],
                        ['title' => 'Uptime', 'value' => '—', 'trend' => 0, 'trendLabel' => 'serveur'],
                    ],
                    'traffic'         => [],
                    'health'          => [],
                    'logs'            => [],
                    'utilisateurs'    => [],
                    'repartition_roles' => [],
                    'ecoles'            => 0,
                    'utilisateurs_total' => 0,
                    'taux_activite'     => 0,
                    'plans_actifs'      => 0,
                    'modules_actifs'    => 0,
                    'revenus'           => 0,
                    'nouveautes_semaine' => 0,
                    'activites_recentes' => [],
                ];
            }
        });

        return response()->json(['success' => true, 'data' => $data]);
    }
}
