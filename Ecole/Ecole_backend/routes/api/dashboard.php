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
    // ─── Directeur ───────────────────────────────────────────────────
    Route::get('/directeur/data', [DashboardController::class, 'getDashboardData']);
    Route::post('/directeur/invalidate-cache', [DashboardController::class, 'invalidateCache']);
    Route::get('/directeur', [DashboardController::class, 'directeur']);

    // ─── Enseignant ──────────────────────────────────────────────────
    Route::get('/enseignant', [DashboardController::class, 'enseignant']);

    // ─── Élève ───────────────────────────────────────────────────────
    Route::get('/eleve', [DashboardController::class, 'eleve']);

    // ─── Parent ──────────────────────────────────────────────────────
    Route::get('/parent/{parentId?}', [DashboardController::class, 'parent']);

    // ─── Admin ───────────────────────────────────────────────────────
    Route::get('/admin', [DashboardController::class, 'admin']);

    // ─── Université ──────────────────────────────────────────────────
    Route::get('/universite', [DashboardController::class, 'universite']);

    // ─── Staff (6 rôles — R4) ────────────────────────────────────────
    Route::get('/comptable', [DashboardController::class, 'comptable']);
    Route::get('/surveillant', [DashboardController::class, 'surveillant']);
    Route::get('/censeur', [DashboardController::class, 'censeur']);
    Route::get('/infirmier', [DashboardController::class, 'infirmier']);
    Route::get('/bibliothecaire', [DashboardController::class, 'bibliothecaire']);
    Route::get('/secretaire', [DashboardController::class, 'secretaire']);
});

// Routes spécifiques Directeur
Route::prefix('directeur')->group(function () {
    Route::get('/stats', [DirecteurController::class, 'stats']);
    Route::get('/classes', [DirecteurController::class, 'classes']);
    Route::get('/enseignants', [DirecteurController::class, 'enseignants']);
});
