<?php

use App\Http\Controllers\{
    ClassesController,
    EleveController,
    MatieresController,
    NotesController,
    SeriesController,
    BulletinController,
    typeEvaluationController,
    periodesController,
    EmploiDuTempsController,
    CahierDeTexteController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Académiques - Protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ============ MATIÈRES ============
    Route::prefix('matieres')->group(function () {
        Route::get('/', [MatieresController::class, 'index']);
        Route::post('/store', [MatieresController::class, 'store'])->middleware('role:directeur,admin');
        Route::post('/update/{id}', [MatieresController::class, 'update'])->middleware('role:directeur,admin');
        Route::delete('/delete/{id}', [MatieresController::class, 'destroy'])->middleware('role:directeur,admin');
        
        Route::get('/niveaux/{niveau}', [MatieresController::class, 'getByNiveau']);
    });

    // ============ CLASSES ============
    Route::prefix('classes')->group(function () {
        Route::get('/', [ClassesController::class, 'index']);
        Route::post('/store', [ClassesController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ClassesController::class, 'show']);
        Route::get('/{id}/eleves', [ClassesController::class, 'getEleves']);
    });

    // ============ ÉLÈVES ============
    Route::prefix('eleves')->group(function () {
        Route::get('/', [EleveController::class, 'index'])->middleware('role:directeur,enseignant');
        Route::post('/store', [EleveController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [EleveController::class, 'show']);
        Route::put('/update/{id}', [EleveController::class, 'update'])->middleware('role:directeur');
        
        // Espace Elève
        Route::get('/me/bulletin/{periode}', [EleveController::class, 'bulletin'])->middleware('role:eleve');
        Route::get('/me/emploi-du-temps', [EleveController::class, 'emploiDuTemps'])->middleware('role:eleve');
    });

    // ============ NOTES ============
    Route::prefix('notes')->group(function () {
        Route::get('/eleve/{eleveId?}', [NotesController::class, 'index']);
        Route::post('/store', [NotesController::class, 'store'])->middleware('role:directeur,enseignant');
        Route::post('/import', [NotesController::class, 'import'])->middleware(['role:directeur,enseignant', 'throttle:5,1']);
    });

    // ============ BULLETINS ============
    Route::get('/bulletins/eleve/{eleveId}/{periode}', [BulletinController::class, 'getBulletin'])->middleware('role:directeur,parent,eleve');

    // ============ CAHIER DE TEXTE ============
    Route::prefix('cahier-texte')->group(function () {
        Route::get('/', [CahierDeTexteController::class, 'index']);
        Route::post('/', [CahierDeTexteController::class, 'store'])->middleware('role:enseignant,directeur');
        Route::get('/classe/{classeId}', [CahierDeTexteController::class, 'getByClasse']);
    });

});
