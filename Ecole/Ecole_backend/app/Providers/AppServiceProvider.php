<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
        // Les limiteurs vivaient dans `RouteServiceProvider`, supprimé avec le
        // passage au squelette Laravel 11 : le routage est désormais déclaré
        // dans bootstrap/app.php (cf. audit P4.5).
        $this->configureRateLimiting();

        // `school_exists:` — cf. App\Validation\SchoolExistsRule. La règle
        // `exists:` de Laravel travaille sur le query builder brut et ne voit
        // donc pas le scope tenant.
        \App\Validation\SchoolExistsRule::register();

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

        // Détecter les N+1 hors production : une relation chargée paresseusement
        // lève désormais une exception au lieu de multiplier silencieusement les
        // requêtes. 187 `with()` et 54 boucles cohabitent dans les contrôleurs,
        // sans garde-fou jusqu'ici (cf. audit P2.6).
        //
        // Jamais en production : une relation oubliée y casserait une page qui
        // fonctionne, en plus lent mais correctement.
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(
            !app()->isProduction()
        );

        // Résoudre le schema builder instancie une connexion à la base — ce
        // qui, appelé inconditionnellement dans boot(), forçait une connexion
        // DB à CHAQUE démarrage de l'application (y compris `artisan` et les
        // tests, qui échouaient tous au boot). Le réglage ne sert qu'aux
        // migrations sur MySQL < 5.7 : on le limite à ce contexte.
        if ($this->app->runningInConsole() && $this->isRunningMigration()) {
            Schema::defaultStringLength(191);
        }
    }

    /**
     * La commande en cours est-elle une commande de migration ?
     */
    private function isRunningMigration(): bool
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

    /**
     * Limiteurs de débit nommés, référencés par `throttle:<nom>` dans les
     * fichiers de routes.
     */
    protected function configureRateLimiting(): void
    {
        // API générale : 300 req/min pour utilisateurs connectés, 60 pour anonymes
        RateLimiter::for('api', function (Request $request) {
            if ($request->user()) {
                return Limit::perMinute(300)->by($request->user()->id);
            }
            return Limit::perMinute(60)->by($request->ip());
        });

        // Auth endpoints : deux limites cumulées.
        // Indexer uniquement sur l'email laissait passer une pulvérisation de
        // mots de passe : un attaquant changeait de compte à chaque tentative
        // et n'atteignait jamais le quota (cf. audit S16).
        RateLimiter::for('auth', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email')));

            return [
                Limit::perMinute(5)->by('auth-id:' . $email . '|' . $request->ip()),
                Limit::perMinute(20)->by('auth-ip:' . $request->ip()),
            ];
        });

        // Paiements : 30 req/min sensibilité financière
        RateLimiter::for('paiements', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Export/Import : 5 req/min opérations lourdes
        RateLimiter::for('exports', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Webhooks : 100 req/min pour les providers externes
        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute(100)->by($request->ip());
        });

        // IA endpoints : 20 req/min pour éviter les coûts excessifs
        RateLimiter::for('ia', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });
    }
}
