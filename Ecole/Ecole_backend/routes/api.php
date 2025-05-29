<?php
// Ecole_backend/routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\EleveController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\MatieresController;
use App\Http\Controllers\MoyennesController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\SeriesController;
use App\Http\Controllers\SessionsController;
use App\Http\Controllers\SessionsMatieresController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/inscription', [AuthController::class, 'inscription']);
Route::post('/connexion', [AuthController::class, 'connexion']);

// Matieres
Route::post('/matieres/store', [MatieresController::class, 'store']);
Route::get('/matieres', [MatieresController::class, 'index']);
Route::put('/matieres/update/{id}', [MatieresController::class, 'update']);
Route::delete('/matieres/delete/{id}', [MatieresController::class, 'destroy']);

// Series
Route::prefix('series')->group(function () {
    Route::get('/', [SeriesController::class, 'index']);
    Route::post('/store', [SeriesController::class, 'store']);
    Route::get('/{id}', [SeriesController::class, 'show']);
    Route::put('/update/{id}', [SeriesController::class, 'update']);
    Route::delete('/delete/{id}', [SeriesController::class, 'destroy']);
});

// Classes
Route::post('/classes/store', [ClassesController::class, 'store']);
Route::get('/classes', [ClassesController::class, 'index']);
Route::put('/classes/update/{id}', [ClassesController::class, 'update']);
Route::delete('/classes/delete/{id}', [ClassesController::class, 'destroy']);
Route::get('/classes/{id}', [ClassesController::class, 'show']);

// Sessions
Route::post('/sessions/store', [SessionsController::class, 'store']);
Route::get('/sessions', [SessionsController::class, 'index']);
Route::delete('/sessions/{id}', [SessionsController::class, 'destroy']);
Route::get('/sessions/show/{id}', [SessionsController::class, 'show']);
Route::post('/sessions/{session}/eleves', [SessionsController::class, 'addCandidat']);
Route::get('/sessions_matieres', [SessionsMatieresController::class, 'index']);
Route::get('/sessions/{session}/moyennes', [NotesController::class, 'getMoyennesBySession']);
Route::get('/sessions/{session}/note', [NotesController::class, 'getNotesBySession']);
Route::get('sessions/{id}/matieres', [SessionsController::class, 'getMatieresBySession']);
Route::get('sessions/{id}/eleves', [SessionsController::class, 'getCandidatsBySession']);

// Eleves
Route::get('/eleves', [EleveController::class, 'index']);
Route::post('/eleves/store', [EleveController::class, 'store']);
Route::put('/eleves/update/{id}', [EleveController::class, 'update']);
Route::delete('/eleves/delete/{id}', [EleveController::class, 'destroy']);
Route::get('/eleves/{id}/moyennes', [EleveController::class, 'getMoyennesByCandidats']);
Route::get('/eleves/{id}/notes', [NotesController::class, 'getNotesByCandidats']);
Route::get('/eleves/{id}/bulletin', [EleveController::class, 'getBulletin']);

// Notes (CRUD + import + data)
Route::prefix('notes')->group(function () {
    Route::get('/', [NotesController::class, 'index']);
    Route::post('/', [NotesController::class, 'store']);
    Route::get('/{id}', [NotesController::class, 'show']);
    Route::put('/{id}', [NotesController::class, 'update']);
    Route::delete('/{id}', [NotesController::class, 'destroy']);
    Route::post('/import', [NotesController::class, 'importNotes']);
    Route::get('/data/classes', [NotesController::class, 'getClasses']);
    Route::get('/data/matieres', [NotesController::class, 'getMatieres']);
    Route::get('/data/eleves/{classe_id}', [NotesController::class, 'getElevesByClasse']);
});

// Moyennes (CRUD + import + data)

    Route::prefix('moyennes')->group(function () {
        // CRUD des moyennes
        Route::get('/', [MoyennesController::class, 'index']);
        Route::post('/', [MoyennesController::class, 'store']);
        Route::get('/{id}', [MoyennesController::class, 'show']);
        Route::put('/{id}', [MoyennesController::class, 'update']);
        Route::delete('/{id}', [MoyennesController::class, 'destroy']);
        
        // Import en masse
        Route::post('/import', [MoyennesController::class, 'importMoyennes']);
        
        // Données pour les formulaires
        Route::get('/data/classes', [MoyennesController::class, 'getClasses']);
        Route::get('/data/matieres', [MoyennesController::class, 'getMatieres']);
        Route::get('/data/eleves/{classe_id}', [MoyennesController::class, 'getElevesByClasse']);
    });

    //inscription   
    Route::get('/classes', [ClassesController::class, 'index']);
    
    

    // Routes pour les séries
Route::prefix('series')->group(function () {
    // Routes CRUD de base
    Route::get('/', [SeriesController::class, 'index']);
    Route::post('/', [SeriesController::class, 'store']);
    Route::get('/{id}', [SeriesController::class, 'show']);
    Route::put('/{id}', [SeriesController::class, 'update']);
    Route::delete('/{id}', [SeriesController::class, 'destroy']);

    // Routes pour les matières
    Route::get('/{id}/matieres', [SeriesController::class, 'getMatieres']);
    Route::get('/{id}/matieres/coefficients', [SeriesController::class, 'getMatieresWithCoefficients']);
    Route::get('/{id}/matieres/eleve/{eleve_id}', [SeriesController::class, 'getMatieresByEleve']);

    // Routes pour les élèves
    Route::get('/{id}/eleves', [SeriesController::class, 'getEleves']);
    Route::get('/{id}/eleves/matiere/{matiere_id}', [SeriesController::class, 'getElevesByMatiere']);
    Route::get('/{id}/eleves/classe/{classe_id}', [SeriesController::class, 'getElevesByClasse']);

    // Routes pour les moyennes
    Route::get('/{id}/moyenne/eleve/{eleve_id}', [SeriesController::class, 'calculMoyenneGenerale']);
    Route::get('/{id}/moyenne-generale/eleve/{eleve_id}', [SeriesController::class, 'getMoyenneGeneraleByEleve']);

    // Routes pour les relations inverses
    Route::get('/eleve/{eleve_id}', [SeriesController::class, 'getSeriesByEleve']);
    Route::get('/classe/{classe_id}', [SeriesController::class, 'getSeriesByClasse']);
    Route::get('/matiere/{matiere_id}', [SeriesController::class, 'getSeriesByMatiere']);
});