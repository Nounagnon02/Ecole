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
            Route::get('/dashboard/{role}/data', 'App\Http\Controllers\DashboardController@getDashboardData');

            // Academic
            Route::apiResource('matieres', 'App\Http\Controllers\MatieresController');
            Route::apiResource('classes', 'App\Http\Controllers\ClassesController');
            Route::apiResource('eleves', 'App\Http\Controllers\EleveController');
            Route::apiResource('notes', 'App\Http\Controllers\NotesController');

            // Services
            Route::apiResource('messages', 'App\Http\Controllers\MessageController');
            Route::apiResource('paiements', 'App\Http\Controllers\PaiementController');
            Route::apiResource('notifications', 'App\Http\Controllers\NotificationController');

            // IA / EduPilot
            Route::prefix('ia')->middleware('throttle:ia')->group(function () {
                Route::post('/chat', 'App\Http\Controllers\Api\AIController@chat');
                Route::get('/predictive', 'App\Http\Controllers\Api\AIController@predictiveAnalysis');
                Route::post('/lesson-plan', 'App\Http\Controllers\Api\AIController@lessonPlan');
                Route::post('/tutor', 'App\Http\Controllers\Api\AIController@tutor');
                Route::post('/parent-assistant', 'App\Http\Controllers\Api\AIController@parentAssistant');
                Route::post('/analyze-results', 'App\Http\Controllers\Api\AIController@analyzeResults');
            });
        });
    });
});
