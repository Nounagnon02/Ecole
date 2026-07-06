<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DirecteurController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Dashboard - Protégées par Sanctum
|--------------------------------------------------------------------------
|
*/

Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    // ─── Directeur ───────────────────────────────────────────────────
    Route::get('/directeur/data', [DashboardController::class, 'getDashboardData']);
    Route::post('/directeur/invalidate-cache', [DashboardController::class, 'invalidateCache'])->middleware('role:directeur');
    Route::get('/directeur', [DashboardController::class, 'directeur'])->middleware('role:directeur');

    // ─── Enseignant ──────────────────────────────────────────────────
    Route::get('/enseignant', [DashboardController::class, 'enseignant'])->middleware('role:enseignant');

    // ─── Élève ───────────────────────────────────────────────────────
    Route::get('/eleve', [DashboardController::class, 'eleve'])->middleware('role:eleve');

    // ─── Parent ──────────────────────────────────────────────────────
    Route::get('/parent', [DashboardController::class, 'parent'])->middleware('role:parent');

    // ─── Admin ───────────────────────────────────────────────────────
    Route::get('/admin', [DashboardController::class, 'admin'])->middleware('role:admin,super-admin');

    // ─── Université ──────────────────────────────────────────────────
    Route::get('/universite', [DashboardController::class, 'universite'])->middleware('role:recteur,doyen,professeur,etudiant,personnel');

    // ─── Staff (6 rôles — R4) ────────────────────────────────────────
    Route::get('/comptable', [DashboardController::class, 'comptable'])->middleware('role:comptable');
    Route::get('/surveillant', [DashboardController::class, 'surveillant'])->middleware('role:surveillant');
    Route::get('/censeur', [DashboardController::class, 'censeur'])->middleware('role:censeur');
    Route::get('/infirmier', [DashboardController::class, 'infirmier'])->middleware('role:infirmier');
    Route::get('/bibliothecaire', [DashboardController::class, 'bibliothecaire'])->middleware('role:bibliothecaire');
    Route::get('/secretaire', [DashboardController::class, 'secretaire'])->middleware('role:secretaire');
});

// Routes spécifiques Directeur
Route::middleware('auth:sanctum')->prefix('directeur')->group(function () {
    Route::get('/stats', [DirecteurController::class, 'stats'])->middleware('role:directeur');
    Route::get('/classes', [DirecteurController::class, 'classes'])->middleware('role:directeur');
    Route::get('/enseignants', [DirecteurController::class, 'enseignants'])->middleware('role:directeur');
});
