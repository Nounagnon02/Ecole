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

// Le 3e paramètre de chaque `throttle:N,M` nomme son compteur. Sans lui, la clé
// ne dépend que de l'utilisateur (ou de l'IP) : toutes ces routes partageaient
// un seul compteur. Voir tests/Feature/Api/RateLimitBucketsTest.php.

// Inscription (Protégé)
Route::post('/inscription', [AuthController::class, 'inscription'])->middleware(['auth:sanctum', 'role:directeur,super-admin,admin', 'throttle:10,1,inscription']);

// Connexion (publique — rate limité + lockout après 5 échecs)
Route::post('/auth/login', [AuthController::class, 'connexion'])->middleware(['throttle:auth', 'account.lockout']);

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'getProfile'])->middleware('throttle:60,1,auth-me');
    Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->middleware('throttle:60,1,auth-profile');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:60,1,auth-logout');

    // 2FA
    Route::post('/auth/2fa/setup', [TwoFactorController::class, 'showSetup'])->middleware('throttle:60,1,2fa-setup');
    Route::post('/auth/2fa/verify', [TwoFactorController::class, 'verify'])->middleware('throttle:60,1,2fa-verify');
    Route::post('/auth/2fa/disable', [TwoFactorController::class, 'disable'])->middleware('throttle:60,1,2fa-disable');

    // Email verification
    Route::post('/auth/send-verification-email', [AuthController::class, 'sendVerificationEmail'])->middleware('throttle:60,1,verification-email');
});

// Vérification 2FA après login
Route::post('/auth/2fa/verify-login', [TwoFactorController::class, 'verifyLogin'])
    ->middleware(['auth:sanctum', 'throttle:5,1,2fa-verify-login']);

// Vérification email (lien cliquable, pas de middleware auth)
Route::get('/auth/verify-email/{token}', [AuthController::class, 'verifyEmail']);

// Sélection d'école après login multi-écoles (token temporaire)
Route::post('/auth/select-school', [AuthController::class, 'selectSchool'])->middleware('throttle:10,1,select-school');

// Mot de passe oublié — rate limité contre le spam
Route::post('/auth/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLink'])
    ->middleware('throttle:3,1,forgot-password');
Route::post('/auth/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1,reset-password');
