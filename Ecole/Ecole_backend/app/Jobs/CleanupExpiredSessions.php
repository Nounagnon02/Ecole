<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CleanupExpiredSessions — purge les sessions expirées de la table `sessions`.
 *
 * La table croît continuellement car chaque connexion SPA crée une ligne. Sans
 * ce job, des milliers de lignes mortes s'accumulent et ralentissent les
 * requêtes middleware (cf. audit AUTH-18).
 *
 * Planifié via `php artisan schedule:run` (à ajouter dans Console/Kernel).
 */
class CleanupExpiredSessions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        if (!DB::getSchemaBuilder()->hasTable('sessions')) {
            return;
        }

        $deleted = DB::table('sessions')
            ->where('last_activity', '<', now()->subMinutes(
                (int) config('session.lifetime', 120)
            ))
            ->delete();

        Log::info("[SessionCleanup] {$deleted} sessions expirées supprimées.");
    }
}
