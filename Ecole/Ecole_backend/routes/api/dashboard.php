<?php

use App\Http\Controllers\Dashboard\{
    DirecteurDashboardController,
    EnseignantDashboardController,
    ParentDashboardController,
    EleveDashboardController,
    AdminDashboardController,
    UniversiteDashboardController,
    ComptableDashboardController,
    SurveillantDashboardController,
    CenseurDashboardController,
    InfirmierDashboardController,
    BibliothecaireDashboardController,
    SecretaireDashboardController,
};
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
    Route::get('/directeur/data', [DirecteurDashboardController::class, 'getDashboardData'])
        ->middleware('role:directeur,censeur,secretaire');
    Route::post('/directeur/invalidate-cache', [DirecteurDashboardController::class, 'invalidateCache'])->middleware('role:directeur');
    Route::get('/directeur', [DirecteurDashboardController::class, 'directeur'])->middleware('role:directeur');

    // ─── Enseignant ──────────────────────────────────────────────────
    Route::get('/enseignant', [EnseignantDashboardController::class, 'enseignant'])->middleware('role:enseignant');

    // ─── Élève ───────────────────────────────────────────────────────
    Route::get('/eleve', [EleveDashboardController::class, 'eleve'])->middleware('role:eleve');

    // ─── Parent ──────────────────────────────────────────────────────
    Route::get('/parent', [ParentDashboardController::class, 'parent'])->middleware('role:parent');

    // ─── Admin ───────────────────────────────────────────────────────
    Route::get('/admin', [AdminDashboardController::class, 'admin'])->middleware('role:admin,super-admin');

    // ─── Université ──────────────────────────────────────────────────
    Route::get('/universite', [UniversiteDashboardController::class, 'universite'])->middleware('role:recteur,doyen,professeur,etudiant,personnel');

    // ─── Staff (6 rôles — R4) ────────────────────────────────────────
    Route::get('/comptable', [ComptableDashboardController::class, 'comptable'])->middleware('role:comptable');
    Route::get('/surveillant', [SurveillantDashboardController::class, 'surveillant'])->middleware('role:surveillant');
    Route::get('/censeur', [CenseurDashboardController::class, 'censeur'])->middleware('role:censeur');
    Route::get('/infirmier', [InfirmierDashboardController::class, 'infirmier'])->middleware('role:infirmier');
    Route::get('/bibliothecaire', [BibliothecaireDashboardController::class, 'bibliothecaire'])->middleware('role:bibliothecaire');
    Route::get('/secretaire', [SecretaireDashboardController::class, 'secretaire'])->middleware('role:secretaire');
});

// Routes spécifiques Directeur
Route::middleware('auth:sanctum')->prefix('directeur')->group(function () {
    Route::get('/stats', [DirecteurController::class, 'stats'])->middleware('role:directeur');
    Route::get('/classes', [DirecteurController::class, 'classes'])->middleware('role:directeur');
    Route::get('/enseignants', [DirecteurController::class, 'enseignants'])->middleware('role:directeur');
});
