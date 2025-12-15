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
Route::post('/inscription', [AuthController::class, 'inscription']);
Route::post('/connexion', [AuthController::class, 'connexion']);

// Profil utilisateur
Route::prefix('user')->group(function () {
    Route::get('/profile', [AuthController::class, 'getProfile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
});
