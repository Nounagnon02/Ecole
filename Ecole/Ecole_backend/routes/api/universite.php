<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\universite\{
    UniversiteController,
    FaculteController,
    DepartementController,
    FiliereController,
    EtudiantController,
    EnseignantController as UnivEnseignantController,
    MatiereController as UnivMatiereController,
    NoteController as UnivNoteController,
    InscriptionController,
    SemestreController,
    AnneeAcademiqueController,
    PersonnelController,
    PaiementController as UnivPaiementController,
    DiplomeController
};

/*
|--------------------------------------------------------------------------
| Routes Universitaires - Protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('universite')->group(function () {
    // Universités
    Route::apiResource('universites', UniversiteController::class);
    
    // Facultés
    Route::apiResource('facultes', FaculteController::class);
    
    // Départements
    Route::apiResource('departements', DepartementController::class);
    
    // Filières
    Route::apiResource('filieres', FiliereController::class);
    
    // Étudiants
    Route::apiResource('etudiants', EtudiantController::class);
    
    // Enseignants universitaires
    Route::apiResource('enseignants', UnivEnseignantController::class);
    
    // Matières/UE
    Route::apiResource('matieres', UnivMatiereController::class);
    
    // Notes
    Route::apiResource('notes', UnivNoteController::class);
});
