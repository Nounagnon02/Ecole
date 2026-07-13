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
    CahierDeTexteController,
    DevoirController
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
        Route::get('/export', [NotesController::class, 'export'])->middleware('role:directeur,enseignant');
        Route::post('/{id}/lock', [NotesController::class, 'lock'])->middleware('role:directeur,enseignant');
        Route::post('/{id}/unlock', [NotesController::class, 'unlock'])->middleware('role:directeur,enseignant');
        Route::get('/classement/{classeId}/{periode}', [NotesController::class, 'classement'])->middleware('role:directeur,enseignant');
    });

    // ============ BULLETINS ============
    Route::get('/bulletins/eleve/{eleveId}/{periode}', [BulletinController::class, 'getBulletin'])->middleware('role:directeur,parent,eleve');

    // ============ CAHIER DE TEXTE ============
    Route::prefix('cahier-texte')->group(function () {
        Route::get('/', [CahierDeTexteController::class, 'index']);
        Route::post('/', [CahierDeTexteController::class, 'store'])->middleware('role:enseignant,directeur');
        Route::get('/classe/{classeId}', [CahierDeTexteController::class, 'getByClasse']);
    });

    // ============ EMPLOI DU TEMPS ============
    Route::prefix('emploi-du-temps')->group(function () {
        Route::get('/', [EmploiDuTempsController::class, 'index']);
        Route::post('/store', [EmploiDuTempsController::class, 'store'])->middleware('role:directeur');
        Route::put('/update/{id}', [EmploiDuTempsController::class, 'update'])->middleware('role:directeur');
        Route::delete('/delete/{id}', [EmploiDuTempsController::class, 'destroy'])->middleware('role:directeur');
        Route::get('/classe/{classeId}', [EmploiDuTempsController::class, 'getByClasse']);
    });

    // ============ DEVOIRS ============
    Route::prefix('devoirs')->group(function () {
        Route::get('/enseignant', [DevoirController::class, 'indexEnseignant'])->middleware('role:directeur,enseignant');
        Route::get('/eleve', [DevoirController::class, 'indexEleve'])->middleware('role:eleve,parent');
        Route::post('/', [DevoirController::class, 'store'])->middleware('role:directeur,enseignant');
        Route::get('/{id}', [DevoirController::class, 'show'])->middleware('role:directeur,enseignant,eleve,parent');
        Route::post('/{id}/soumettre', [DevoirController::class, 'soumettre'])->middleware('role:eleve');
        Route::post('/{id}/noter/{eleveId}', [DevoirController::class, 'noter'])->middleware('role:directeur,enseignant');
        Route::delete('/{id}', [DevoirController::class, 'destroy'])->middleware('role:directeur,enseignant');
    });

});
