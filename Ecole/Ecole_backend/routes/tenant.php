<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for tenant subdomains.
| Each tenant has its own database and isolated data.
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    // Tenant API routes (v1)
    Route::prefix('api/v1')->group(function () {
        // Auth
        Route::post('/auth/login', 'App\Http\Controllers\AuthController@connexion');

        // Protected tenant routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/auth/me', 'App\Http\Controllers\AuthController@getProfile');
            Route::post('/auth/logout', 'App\Http\Controllers\AuthController@logout');

            // Dashboard
            // Legacy : exposait getDashboardData pour n'importe quel `role` —
            // l'URL dictait le rôle, pas le compte. Restreint aux rôles du
            // référentiel (directeur, censeur, secretaire) comme la route
            // moderne api/dashboard.php (cf. audit).
            Route::get('/dashboard/{role}/data', 'App\Http\Controllers\Dashboard\DirecteurDashboardController@getDashboardData')
                ->middleware('role:directeur,censeur,secretaire');

            // Academic
            Route::apiResource('matieres', 'App\Http\Controllers\MatieresController');
            Route::apiResource('classes', 'App\Http\Controllers\ClassesController');
            Route::apiResource('eleves', 'App\Http\Controllers\EleveController');
            Route::apiResource('notes', 'App\Http\Controllers\NotesController');

            // Services
            //
            // `->only()` explicite : ces contrôleurs n'implémentent pas les
            // sept verbes d'un apiResource. Sans restriction, les routes
            // étaient déclarées puis échouaient en 500 à l'appel. Et
            // `PaiementController` n'existe pas du tout — la ressource
            // 'paiements' pointait dans le vide (les paiements passent par
            // PaymentController / ComptableController, cf. routes/api/services.php).
            Route::apiResource('messages', 'App\Http\Controllers\MessageController')
                ->only(['index', 'store']);
            Route::apiResource('notifications', 'App\Http\Controllers\NotificationController')
                ->only(['index', 'store']);

            // IA / EduPilot : déclarées dans routes/api/ia.php, sur la surface
            // principale. Les redéclarer ici créerait des URI en double, la
            // dernière enregistrée masquant la précédente.
        });
    });
});
