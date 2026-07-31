<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     *
     * @return void
     */
    public function boot()
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Couche SaaS centrale (super-admin plateforme + onboarding public).
            // Ce fichier n'était chargé nulle part : les ~25 endpoints de
            // gestion des tenants, plans, abonnements, facturation, white-label
            // et analytics étaient injoignables (cf. audit F1).
            // Les préfixes /api/v1/... sont déclarés dans le fichier lui-même.
            Route::middleware('api')
                ->group(base_path('routes/central.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     *
     * @return void
     */
    protected function configureRateLimiting()
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
