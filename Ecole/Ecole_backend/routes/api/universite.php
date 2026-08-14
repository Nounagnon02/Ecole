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
    DiplomeController,
    MyCoursesController,
    PlanningController,
    DevoirController as UnivDevoirController
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
    // Le DELETE de la ressource délègue à `deactivate` : un dossier étudiant
    // porte diplômes, inscriptions, notes et paiements, et ne se supprime pas.
    Route::post('etudiants/{etudiant}/deactivate', [EtudiantController::class, 'deactivate'])
        ->middleware('role:recteur,doyen,super-admin');
    Route::post('etudiants/{etudiant}/activate', [EtudiantController::class, 'activate'])
        ->middleware('role:recteur,doyen,super-admin');

    // Enseignants universitaires
    Route::apiResource('enseignants', UnivEnseignantController::class)->middleware('role:recteur,doyen,super-admin');

    // Matières/UE
    Route::apiResource('matieres', UnivMatiereController::class)->middleware('role:recteur,doyen,professeur,super-admin');

    // Notes
    Route::apiResource('notes', UnivNoteController::class)->middleware('role:recteur,doyen,professeur,super-admin');

    /*
    |----------------------------------------------------------------------
    | Espace personnel — ce que le compte connecté est concerné par
    |----------------------------------------------------------------------
    |
    | Ces routes n'existaient pas faute de lien compte ↔ profil : `etudiants`
    | ne portait pas de `user_id`, donc aucune vue personnelle du module
    | n'était calculable (cf. ECARTS_FRONT_BACK.md §4).
    |
    */

    // Un étudiant y voit les matières de sa filière, un enseignant celles
    // qu'il assure. Les rôles administratifs n'ont pas de « mes cours ».
    Route::get('mes-cours', [MyCoursesController::class, 'index'])
        ->middleware('role:etudiant,professeur');

    /*
    |----------------------------------------------------------------------
    | Planning — le calendrier universitaire
    |----------------------------------------------------------------------
    |
    | Lecture ouverte à tout le module (le contrôleur restreint l'étudiant à
    | sa filière et aux séances communes) ; écriture réservée à ceux qui
    | programment.
    |
    */
    Route::get('planning', [PlanningController::class, 'index']);
    Route::get('planning/{id}', [PlanningController::class, 'show']);
    Route::post('planning', [PlanningController::class, 'store'])
        ->middleware('role:recteur,doyen,professeur,personnel');
    Route::put('planning/{id}', [PlanningController::class, 'update'])
        ->middleware('role:recteur,doyen,professeur,personnel');
    Route::patch('planning/{id}', [PlanningController::class, 'update'])
        ->middleware('role:recteur,doyen,professeur,personnel');
    Route::delete('planning/{id}', [PlanningController::class, 'destroy'])
        ->middleware('role:recteur,doyen,personnel');

    /*
    |----------------------------------------------------------------------
    | Devoirs — l'équivalent universitaire de `devoirs`
    |----------------------------------------------------------------------
    |
    | Le gros grain est ici, le fin grain dans `Universite\DevoirPolicy` :
    | `role:professeur` dit qu'un enseignant peut créer un devoir, la policy
    | dit qu'il ne peut le faire que sur une matière qu'il assure.
    |
    */
    Route::get('devoirs', [UnivDevoirController::class, 'index']);
    Route::get('devoirs/{id}', [UnivDevoirController::class, 'show']);
    Route::post('devoirs', [UnivDevoirController::class, 'store'])
        ->middleware('role:recteur,doyen,professeur');
    Route::put('devoirs/{id}', [UnivDevoirController::class, 'update'])
        ->middleware('role:recteur,doyen,professeur');
    Route::patch('devoirs/{id}', [UnivDevoirController::class, 'update'])
        ->middleware('role:recteur,doyen,professeur');
    Route::delete('devoirs/{id}', [UnivDevoirController::class, 'destroy'])
        ->middleware('role:recteur,doyen,professeur');

    Route::post('devoirs/{id}/soumettre', [UnivDevoirController::class, 'submit'])
        ->middleware('role:etudiant');
    Route::post('devoirs/{id}/etudiants/{etudiantId}/noter', [UnivDevoirController::class, 'grade'])
        ->middleware('role:recteur,doyen,professeur');
    // Les copies vivent sur le disque privé : elles ne sortent que par cette
    // route, qui vérifie le demandeur.
    Route::get('devoirs/{id}/etudiants/{etudiantId}/copie', [UnivDevoirController::class, 'downloadSubmission']);
});
