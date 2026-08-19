<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TwoFactorController;
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

// Connexion (publique — rate limité + lockout après 5 échecs)
Route::post('/auth/login', [AuthController::class, 'connexion'])->middleware(['throttle:auth', 'account.lockout']);

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'getProfile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // 2FA
    Route::post('/auth/2fa/setup', [TwoFactorController::class, 'showSetup']);
    Route::post('/auth/2fa/verify', [TwoFactorController::class, 'verify']);
    Route::post('/auth/2fa/disable', [TwoFactorController::class, 'disable']);

    // Email verification
    Route::post('/auth/send-verification-email', [AuthController::class, 'sendVerificationEmail']);
});

// Vérification 2FA après login
Route::post('/auth/2fa/verify-login', [TwoFactorController::class, 'verifyLogin'])
    ->middleware(['auth:sanctum', 'throttle:5,1']);

// Vérification email (lien cliquable, pas de middleware auth)
Route::get('/auth/verify-email/{token}', [AuthController::class, 'verifyEmail']);

// Sélection d'école après login multi-écoles (token temporaire)
Route::post('/auth/select-school', [AuthController::class, 'selectSchool'])->middleware('throttle:10,1');

// Mot de passe oublié — rate limité contre le spam
Route::post('/auth/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:3,1');
Route::post('/auth/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1');
