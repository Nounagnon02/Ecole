<?php

use App\Http\Controllers\{
    EnseignantController,
    ParentsController,
    ParentController,
    ComptableController,
    SurveillantController,
    CenseurController,
    InfirmierController,
    BibliothecaireController,
    SecretaireController,
    AuthController,
    ImportController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Utilisateurs et Personnel - Protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ============ ENSEIGNANTS ============
    Route::prefix('enseignants')->group(function () {
        Route::get('/', [EnseignantController::class, 'index']);
        Route::get('/{id}', [EnseignantController::class, 'show']);
        Route::post('/store', [EnseignantController::class, 'store'])->middleware('role:directeur');
        Route::put('/update/{id}', [EnseignantController::class, 'update'])->middleware('role:directeur');
        Route::delete('/delete/{id}', [EnseignantController::class, 'destroy'])->middleware('role:directeur');
    });

    // ============ PARENTS ============
    Route::prefix('parents')->group(function () {
        Route::get('/', [ParentsController::class, 'index']);
        Route::post('/', [ParentsController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ParentsController::class, 'show']);
        Route::get('/{id}/eleves', [ParentsController::class, 'getElevesByParent']);
    });

    // ============ COMPTABLE ============
    Route::prefix('comptable')->middleware('role:directeur,comptable')->group(function () {
        Route::get('/paiements', [ComptableController::class, 'paiements']);
        Route::get('/finances', [ComptableController::class, 'finances']);
        Route::post('/paiements', [ComptableController::class, 'storePaiement']);
    });

    // ============ SURVEILLANT ============
    Route::prefix('surveillant')->middleware('role:directeur,surveillant')->group(function () {
        Route::get('/absences', [SurveillantController::class, 'absences']);
        Route::post('/absences', [SurveillantController::class, 'storeAbsence']);
    });

    // ============ IMPORTS DE DONNÉES ============
    Route::prefix('imports')->middleware('role:directeur')->group(function () {
        Route::post('/eleves', [ImportController::class, 'importEleves']);
    });

    // ... Autres rôles (Censeur, Infirmier, Secretaire) à ajouter au besoin
});
