<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class AppServiceProvider extends ServiceProvider

{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    public function boot()
    {
        // Trace SQL réservée au développement local, et pilotée par un flag.
        // En production ce listener doublait les I/O disque à chaque requête et
        // écrivait des données personnelles en clair dans les logs — emails,
        // notes, données médicales, hachages bcrypt (cf. audit P1).
        if (app()->environment('local') && config('app.log_queries', false)) {
            DB::listen(function ($query) {
                Log::debug('SQL', [
                    'sql'  => $query->sql,
                    'time' => $query->time,
                ]);
            });
        }

        // Résoudre le schema builder instancie une connexion à la base — ce
        // qui, appelé inconditionnellement dans boot(), forçait une connexion
        // DB à CHAQUE démarrage de l'application (y compris `artisan` et les
        // tests, qui échouaient tous au boot). Le réglage ne sert qu'aux
        // migrations sur MySQL < 5.7 : on le limite à ce contexte.
        if ($this->app->runningInConsole() && $this->executeUneMigration()) {
            Schema::defaultStringLength(191);
        }
    }

    /**
     * La commande en cours est-elle une commande de migration ?
     */
    private function executeUneMigration(): bool
    {
        $commande = $_SERVER['argv'][1] ?? '';

        return str_starts_with($commande, 'migrate')
            || in_array($commande, ['db:wipe', 'schema:dump'], true);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    
}
