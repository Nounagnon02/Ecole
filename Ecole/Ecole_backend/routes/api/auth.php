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

// Inscription (Protégé)
Route::post('/inscription', [AuthController::class, 'inscription'])->middleware(['auth:sanctum', 'role:directeur,super-admin,admin', 'throttle:10,1']);

// Connexion (publique — rate limité contre le brute-force)
Route::post('/auth/login', [AuthController::class, 'connexion'])->middleware('throttle:auth');

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'getProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

// Sélection d'école après login multi-écoles (token temporaire)
Route::post('/auth/select-school', [AuthController::class, 'selectSchool'])->middleware('throttle:10,1');

// Mot de passe oublié — rate limité contre le spam
Route::post('/auth/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:3,1');
Route::post('/auth/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1');
