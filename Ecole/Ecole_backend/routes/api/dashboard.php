<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DirecteurController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Dashboard
|--------------------------------------------------------------------------
|
| Routes pour les tableaux de bord avec endpoints consolidés et cache.
| Optimisées pour réduire le nombre d'appels API.
|
*/

Route::prefix('dashboard')->group(function () {
    // Dashboard Directeur - Endpoint consolidé avec cache
    Route::get('/directeur/data', [DashboardController::class, 'getDashboardData']);
    Route::post('/directeur/invalidate-cache', [DashboardController::class, 'invalidateCache']);
    Route::get('/directeur', [DashboardController::class, 'directeur']);
    
    // Dashboard Enseignant
    Route::get('/enseignant', [DashboardController::class, 'enseignant']);
    
    // Dashboard Parent
    Route::get('/parent/{parentId}', [DashboardController::class, 'parent']);
});

// Routes spécifiques Directeur
Route::prefix('directeur')->group(function () {
    Route::get('/stats', [DirecteurController::class, 'stats']);
    Route::get('/classes', [DirecteurController::class, 'classes']);
    Route::get('/enseignants', [DirecteurController::class, 'enseignants']);
});
