<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes d'Authentification
|--------------------------------------------------------------------------
|
| Routes pour la gestion de l'authentification des utilisateurs.
| Inclut : inscription, connexion, profil utilisateur.
|
*/

// Inscription et Connexion
Route::post('/inscription', [AuthController::class, 'inscription'])->middleware(['auth:sanctum', 'role:directeur,super-admin,admin']);
Route::post('/connexion', [AuthController::class, 'connexion']);

// Profil utilisateur (Protégé)
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile', [AuthController::class, 'getProfile']);
});

// Déconnexion
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
