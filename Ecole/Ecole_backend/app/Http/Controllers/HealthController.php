<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Sonde de santé approfondie — DB, cache et file d'attente, pas seulement
 * « le processus PHP répond ».
 *
 * Avant : `{status: 'UP'}` en dur, toujours, quoi qu'il arrive derrière —
 * un load balancer ou une sonde d'orchestrateur pouvait croire l'API saine
 * pendant une panne DB complète, puisque rien ne l'interrogeait jamais.
 *
 * Public et non authentifié (sondes d'infrastructure) : le détail d'une
 * exception (hôte, pilote, message du moteur) part dans les logs
 * (`Log::error`, avec l'ID de corrélation déjà posé par
 * `AssignCorrelationId`), jamais dans la réponse elle-même — seul un statut
 * UP/DOWN par dépendance est exposé.
 */
class HealthController
{
    public function check(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        $healthy = collect($checks)->every(fn (string $status) => $status === 'UP');

        return response()->json([
            'status' => $healthy ? 'UP' : 'DOWN',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    private function checkDatabase(): string
    {
        try {
            DB::select('SELECT 1');

            return 'UP';
        } catch (\Throwable $e) {
            Log::error('[Health] Base de données injoignable', ['exception' => $e->getMessage()]);

            return 'DOWN';
        }
    }

    private function checkCache(): string
    {
        try {
            $key = 'health-check-' . uniqid('', true);
            Cache::put($key, true, 5);
            $ok = Cache::get($key) === true;
            Cache::forget($key);

            if (!$ok) {
                Log::error('[Health] Cache accessible mais lecture/écriture incohérente');
            }

            return $ok ? 'UP' : 'DOWN';
        } catch (\Throwable $e) {
            Log::error('[Health] Cache injoignable', ['exception' => $e->getMessage()]);

            return 'DOWN';
        }
    }

    /**
     * `sync` n'a pas de file réelle à interroger — la vérifier reviendrait à
     * vérifier que PHP peut appeler une fonction, toujours vrai. Pour
     * `database`/`redis`, une vraie ressource externe est en jeu.
     */
    private function checkQueue(): string
    {
        $connection = config('queue.default');

        if ($connection === 'sync') {
            return 'UP';
        }

        try {
            if ($connection === 'database') {
                DB::table('jobs')->count();

                return 'UP';
            }

            if ($connection === 'redis') {
                app('queue')->connection('redis')->size();

                return 'UP';
            }

            // Connexion non reconnue explicitement : ne pas prétendre l'avoir
            // vérifiée plutôt que de deviner un faux positif.
            return 'UP';
        } catch (\Throwable $e) {
            Log::error('[Health] File d\'attente injoignable', [
                'connection' => $connection,
                'exception' => $e->getMessage(),
            ]);

            return 'DOWN';
        }
    }
}
