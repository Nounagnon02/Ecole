<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Universite\{
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

Route::middleware(['auth:sanctum', 'role:recteur,doyen,professeur,etudiant,personnel,super-admin'])->prefix('universite')->group(function () {
    // Universités
    Route::apiResource('universites', UniversiteController::class)->middleware('role:recteur,super-admin');

    // Facultés
    Route::apiResource('facultes', FaculteController::class)->middleware('role:recteur,doyen,super-admin');

    // Départements
    Route::apiResource('departements', DepartementController::class)->middleware('role:recteur,doyen,super-admin');

    // Filières
    Route::apiResource('filieres', FiliereController::class)->middleware('role:recteur,doyen,super-admin');

    // Étudiants
    Route::apiResource('etudiants', EtudiantController::class)->middleware('role:recteur,doyen,professeur,super-admin');

    // Enseignants universitaires
    Route::apiResource('enseignants', UnivEnseignantController::class)->middleware('role:recteur,doyen,super-admin');

    // Matières/UE
    Route::apiResource('matieres', UnivMatiereController::class)->middleware('role:recteur,doyen,professeur,super-admin');

    // Notes
    Route::apiResource('notes', UnivNoteController::class)->middleware('role:recteur,doyen,professeur,super-admin');
});
