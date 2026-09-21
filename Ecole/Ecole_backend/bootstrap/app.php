<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Sentry\Laravel\Integration;

/*
|--------------------------------------------------------------------------
| Squelette Laravel 11
|--------------------------------------------------------------------------
|
| Le projet déclarait `laravel/framework: ^11` tout en tournant sur le
| squelette de Laravel 10 : ancien `bootstrap/app.php`, `App\Http\Kernel`,
| `App\Console\Kernel`, `App\Exceptions\Handler`, `RouteServiceProvider`.
| Supporté, mais non idiomatique — et c'est précisément ce qui rendait la
| montée en Laravel 12 pénible, alors que sept avis de sécurité sont
| explicitement ignorés dans composer.json en attendant cette montée
| (cf. audit P4.5).
|
| La configuration middleware, la planification et la gestion d'exceptions
| sont désormais déclarées ici. Les limiteurs de débit ont rejoint
| `AppServiceProvider::boot()`.
|
*/

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        then: function () {
            // Couche SaaS centrale : les préfixes /api/v1/... sont déclarés
            // dans le fichier lui-même, d'où l'absence de `prefix` ici.
            Route::middleware('api')->group(base_path('routes/central.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->use([
            // En tout premier : fournit l'ID de corrélation (log context,
            // tag Sentry, en-tête `X-Request-Id`) que tout le reste — y
            // compris les middlewares suivants — peut ensuite s'attendre à
            // trouver déjà en place.
            \App\Http\Middleware\AssignCorrelationId::class,
            \App\Http\Middleware\TrustProxies::class,
            // CORS géré par le middleware natif, qui applique la whitelist de
            // config/cors.php. Ne jamais le remplacer par un middleware qui
            // réfléchit l'en-tête Origin : combiné à supports_credentials,
            // cela ouvre l'API à n'importe quel site tiers (cf. audit S2).
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
            \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
            \App\Http\Middleware\TrimStrings::class,
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
            \App\Http\Middleware\ForceJsonResponse::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->group('web', [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->group('api', [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            // 2FA : un token en attente de vérification (« 2fa:pending ») ne
            // doit atteindre que l'endpoint d'échange, jamais les routes
            // métier. Placé avant EcoleScope pour court-circuiter sans
            // résoudre de contexte d'établissement.
            '2fa.verify',
            \App\Http\Middleware\EcoleScope::class,
        ]);

        $middleware->alias([
            'role'             => \App\Http\Middleware\CheckRole::class,
            'account.lockout'  => \App\Http\Middleware\AccountLockout::class,
            '2fa.verify'       => \App\Http\Middleware\VerifyTwoFactor::class,
            'auth'             => \App\Http\Middleware\Authenticate::class,
            'auth.basic'       => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'auth.session'     => \Illuminate\Session\Middleware\AuthenticateSession::class,
            'cache.headers'    => \Illuminate\Http\Middleware\SetCacheHeaders::class,
            'can'              => \Illuminate\Auth\Middleware\Authorize::class,
            'guest'            => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
            'signed'           => \App\Http\Middleware\ValidateSignature::class,
            'throttle'         => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified'         => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        // Nettoyage des sessions expirées (AUTH-18) — toutes les heures.
        $schedule->job(new \App\Jobs\CleanupExpiredSessions)->hourly();

        // Sauvegarde chiffrée quotidienne (config/backup.php). `withoutOverlapping`
        // : un dump qui traîne au-delà de 24h ne doit pas en chevaucher un
        // second plutôt que de saturer le disque temporaire ou la bande
        // passante vers le disque distant.
        $schedule->command('backup:run')->dailyAt('02:00')->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Sans DSN configuré (`SENTRY_LARAVEL_DSN`), le SDK ne fait rien :
        // sûr par défaut en local/CI, actif dès qu'un DSN est fourni.
        Integration::handles($exceptions);

        // `rethrowIfMeaningful()` (Controller de base) laisse déjà passer les
        // 401/403/404/422 sans les aplatir en 500 : les rapporter à Sentry
        // noierait les vraies pannes sous du bruit attendu (mauvais mot de
        // passe, ressource absente, validation).
        $exceptions->dontReport([
            \Illuminate\Auth\AuthenticationException::class,
            \Illuminate\Auth\Access\AuthorizationException::class,
            \Illuminate\Database\Eloquent\ModelNotFoundException::class,
            \Illuminate\Validation\ValidationException::class,
        ]);
    })
    ->create();
