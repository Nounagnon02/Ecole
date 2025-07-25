<?php
// Ecole_backend/routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\EleveController;
use App\Http\Controllers\MatieresController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\SeriesController;
use App\Http\Controllers\ParentsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BulletinController;
use App\Http\Controllers\EnseignantsController;
use App\Models\Eleves;
use App\Http\Controllers\typeEvaluationController;
use App\Http\Controllers\periodesController;
use App\Http\Controllers\ContributionsController; 
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CinetPayController;
use Illuminate\Support\Facades\DB;

// Auth
Route::post('/inscription', [AuthController::class, 'inscription']);
Route::post('/connexion', [AuthController::class, 'connexion']);


// Matieres
Route::post('/matieres/store', [MatieresController::class, 'store']);
Route::get('/matieres', [MatieresController::class, 'index']);
Route::put('/matieres/update/{id}', [MatieresController::class, 'update']);
Route::delete('/matieres/delete/{id}', [MatieresController::class, 'destroy']);
Route::get('/matieresM', [MatieresController::class, 'getMatieresM']); // Récupérer les matières de la maternelle
Route::get('/matieresP', [MatieresController::class, 'getMatieresP']); // Récupérer les matières de la primaire
Route::get('/matieresS', [MatieresController::class, 'getMatieresS']); // Récupérer les matières du secondaire

// Classes
Route::post('/classes/store', [ClassesController::class, 'store']);
Route::get('/classes', [ClassesController::class, 'index']);
Route::get('/classesES', [ClassesController::class, 'indexS']);
Route::get('/classesM', [ClassesController::class, 'getClassesM']); // Récupérer les classes de la maternelle
Route::get('/classesP', [ClassesController::class, 'getClassesP']); // Récupérer les classes de la primaire 
Route::get('/classesS', [ClassesController::class, 'getClassesS']); // Récupérer les classes du secondaire
Route::get('classes/effectif/maternelle', [ClassesController::class, 'getEffectifMaternelle'] );
Route::get('classes/effectif/primaire', [ClassesController::class, 'getEffectifPrimaire'] );
Route::get('classes/effectif/secondaire', [ClassesController::class, 'getEffectifSecondaire'] );
Route::get('/classes/effectifParClassedeMaternelle', [ClassesController::class, 'getClassesWithEffectifM']);
Route::get('/classes/effectifParClassedePrimaire', [ClassesController::class, 'getClassesWithEffectifP']);
Route::get('/classes/effectifParClassedeSecondaire', [ClassesController::class, 'getClassesWithEffectifS']);
Route::put('/classes/update/{id}', [ClassesController::class, 'update']);
Route::delete('/classes/delete/{id}', [ClassesController::class, 'destroy']);
Route::get('/classes/{id}', [ClassesController::class, 'show']);

// Eleves

Route::get('/elevesT', [EleveController::class, 'getEleves']); 
Route::get('/eleves', [EleveController::class, 'index']);
Route::post('/eleves/store', [EleveController::class, 'store']);
Route::get('/eleves/listeChaqueClasseMaternelle', [EleveController::class, 'getElevesByClasseMaternelle']);
Route::get('/eleves/listeChaqueClassePrimaire', [EleveController::class, 'getElevesByClassePrimaire']);
Route::get('/eleves/listeChaqueClasseSecondaire', [EleveController::class, 'getElevesByClasseSecondaire']);
Route::get('/elevesM', [EleveController::class, 'getElevesMaternelle']); // Récupérer les élèves de la maternelle
Route::get('/elevesP', [EleveController::class, 'getElevesPrimaire']); // Récupérer les élèves de la primaire
Route::get('/elevesS', [EleveController::class, 'getElevesSecondaire']); // Récupérer les élèves du secondaire
Route::get('/eleves/{id}', [EleveController::class, 'show']);
Route::put('/eleves/update/{id}', [EleveController::class, 'update']);
Route::delete('/eleves/delete/{id}', [EleveController::class, 'destroy']);


//Parent
Route::put('/parent/update/{id}', [ParentsController::class, 'update']);
Route::delete('/parent/delete/{id}', [ParentsController::class, 'destroy']);

// Notes (CRUD + import + data)
Route::prefix('notes')->group(function () {

    Route::get('/filter', [NotesController::class, 'filter']);
    Route::get('/filterM', [NotesController::class, 'filterMaternelle']);
    Route::get('/filterP', [NotesController::class, 'filterPrimaire']);
    Route::get('/filterS', [NotesController::class, 'filterSecondaire']);
    Route::post('/', [NotesController::class, 'store']);
    Route::get('/{id}', [NotesController::class, 'show']);
    Route::put('/{id}', [NotesController::class, 'update']);
    Route::delete('/{id}', [NotesController::class, 'destroy']);
    Route::post('/import', [NotesController::class, 'import']);
    Route::get('/data/classes', [NotesController::class, 'getClasses']);
    Route::get('/data/matieres', [NotesController::class, 'getMatieres']);
    Route::get('/data/eleves/{classe_id}', [NotesController::class, 'getElevesByClasse']);
    
    Route::get('/eleve/{eleveId}/{periode?}', [NotesController::class, 'getNotesEleve']);
    Route::get('/statistiques/{eleveId}/{periode}', [NotesController::class, 'getStatistiquesEleve']);
    Route::get('/check/{eleveId}/{matiereId}/{typeEvaluation}/{periode}', [NotesController::class, 'checkNotesRestantes']);
});


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


    // Routes pour les relations inverses
    Route::get('/eleve/{eleve_id}', [SeriesController::class, 'getSeriesByEleve']);
    Route::get('/classe/{classe_id}', [SeriesController::class, 'getSeriesByClasse']);
    Route::get('/matiere/{matiere_id}', [SeriesController::class, 'getSeriesByMatiere']);
});

Route::post('/classes/{id}/matieres', [ClassesController::class, 'attachMatieres']);
Route::get('/classes/{id}/matieres', [ClassesController::class, 'getMatieres']);



// Routes pour les matières
Route::apiResource('matieres', MatieresController::class);
Route::get('matieres/{id}/series', [MatieresController::class, 'getSeries']);

// Routes pour les séries
Route::apiResource('series', SeriesController::class);

// Routes pour gérer les relations entre séries et matières
Route::prefix('series/{id}')->group(function () {
    // Récupérer les matières d'une série avec coefficients
    Route::get('matieres', [SeriesController::class, 'getMatieresWithCoefficients']);
    
    // Attacher une matière à une série
    Route::post('matieres', [SeriesController::class, 'attachMatiere']);
    
    // Synchroniser toutes les matières d'une série
    Route::put('matieres/sync', [SeriesController::class, 'syncMatieres']);
    
    // Mettre à jour le coefficient d'une matière
    Route::put('matieres/{matiere_id}', [SeriesController::class, 'updateMatiereCoefficient']);
    
    // Détacher une matière d'une série
    Route::delete('matieres/{matiere_id}', [SeriesController::class, 'detachMatiere']);
    

});


// Routes pour la liason des series aux classes
Route::get('/classes/{id}/series', [ClassesController::class, 'getSeries']);
Route::put('/classes/{id}/series', [ClassesController::class, 'updateSeries']);

// Routes pour les matières par série/classe
Route::get('/classes/{classId}/series/{serieId}/matieres', [ClassesController::class, 'getSeriesMatieres']);
Route::put('/classes/{classId}/series/{serieId}/matieres', [ClassesController::class, 'updateSeriesMatieres']);

//Routes pour les matières avec séries
Route::get('/matieres-with-series', [MatieresController::class, 'Serie_avec_matieres']);
// Routes pour les classes avec séries
Route::get('/classes-with-series', [SeriesController::class, 'Classe_avec_series']);
Route::get('/with-series-matieres', [ClassesController::class, 'getClassesWithSeriesAndMatieres']);
Route::get('/with-series-matieresMaternelle', [ClassesController::class, 'getClassesWithSeriesAndMatieresMaternelle']);
Route::get('/with-series-matieresPrimaire', [ClassesController::class, 'getClassesWithSeriesAndMatieresPrimaire']);
Route::get(('/with-series-matieresSecondaire'), [ClassesController::class, 'getClassesWithSeriesAndMatieresSecondaire']);   
// Routes pour les parents
Route::prefix('parents')->group(function () {
    Route::get('/{id}', [ParentsController::class, 'show']);
    Route::get('/', [ParentsController::class, 'index']);
    Route::post('/', [ParentsController::class, 'store']);
    Route::put('/{id}', [ParentsController::class, 'update']);
    Route::delete('/{id}', [ParentsController::class, 'destroy']);
    Route::get('{id}/dashboard', [ParentsController::class, 'getDashboardData']);
    Route::get('/{id}/eleves', [ParentsController::class, 'getElevesByParent']); // GET /api/parents/{id}/eleves
    Route::put('/{id}/eleves', [ParentsController::class, 'updateEleves']); // PUT /api/parents/{id}/eleves
});

Route::get('eleves/{childId}/bulletin', [BulletinController::class, 'getBulletin']);

// Routes pour les enseignants
Route::prefix('enseignants')->group(function () {
    Route::get('/', [EnseignantsController::class, 'getEnseignants']);
    Route::get('/MP', [EnseignantsController::class, 'getEnseignantsMP']);
    Route::get('/{id}', [AuthController::class, 'getEnseignantById']);
    Route::post('/store', [AuthController::class, 'storeEnseignant']);
    Route::put('/update/{id}', [AuthController::class, 'updateEnseignant']);
    Route::delete('/delete/{id}', [AuthController::class, 'destroyEnseignant']);
    Route::get('/effectif/maternelle', [EnseignantsController::class, 'getEnseignantMEffectif']);
    Route::get('/effectif/primaire', [EnseignantsController::class, 'getEnseignantPEffectif']);
    Route::get('/effectif/secondaire', [EnseignantsController::class, 'getEnseignantSEffectif']);
});

// Routes pour les relations entre entités
Route::get('/classes/{classeId}/series/{serieId}/matieres', [SeriesController::class,'getMatieresSC']);
Route::put('/classes/{classeId}/series/{serieId}/matieres/enseignants', [SeriesController::class,'updateEnseignants']);
Route::put('/classes/{classeId}/enseignantsMP', [SeriesController::class,'updateEnseignantsMP']);
Route::get('/api/debug/bulletin/{eleveId}/{periode}', [BulletinController::class, 'debugBulletin']);

//Route pour les stats
Route::get('/stats/effectifs', [EleveController::class, 'evolutionEffectifs']);
Route::get('/stats/repartition-notes', [NotesController::class, 'repartitionNotes']);
Route::get('/stats/effectifs-maternelle', [EleveController::class, 'evolutionEffectifsMaternelle']);
Route::get('/stats/repartition-notes-maternelle', [NotesController::class, 'repartitionNotesMaternelle']);
Route::get('/stats/effectifs-primaire', [EleveController::class, 'evolutionEffectifsPrimaire']);
Route::get('/stats/repartition-notes-primaire', [NotesController::class, 'repartitionNotesPrimaire']);
Route::get('/stats/effectifs-secondaire', [EleveController::class, 'evolutionEffectifsSecondaire']);
Route::get('/stats/repartition-notes-secondaire', [NotesController::class, 'repartitionNotesSecondaire']);

//Routes pour les types et periodes d'evaluation
Route::post('/types/store', [typeEvaluationController::class, 'store']);
Route::get('/types', [typeEvaluationController::class, 'index']);
Route::post('/periodes/store', [periodesController::class, 'store']);
Route::get('/periodes', [periodesController::class, 'index']);
Route::post('/periodes/{id}/active', [periodesController::class, 'setActive']);

Route::post('/typeevaluation-classe/attach', [typeEvaluationController::class, 'attach']);
Route::post('/typeevaluation-classe/attach-multiple', [typeEvaluationController::class, 'attachMultiple']);
Route::get('/typeevaluation-classe/by-classe/{classe_id}', [typeEvaluationController::class, 'getByClasse']);
Route::get('/typeevaluationETclasseM', [ClassesController::class, 'getClassesWithPeriodesAndTypesM']);
Route::get('/typeevaluationETclasseP', [ClassesController::class, 'getClassesWithPeriodesAndTypesP']);
Route::get('/typeevaluationETclasseS', [ClassesController::class, 'getClassesWithPeriodesAndTypesS']);
Route::get('/typeevaluationETclasse', [typeEvaluationController::class, 'getClassesWithPeriodesAndTypes']);

Route::delete('/typeevaluation-classe/{id}', [typeEvaluationController::class, 'destroy']);


Route::get('/classes/{classeId}/series/{serieId}/matieres', [SeriesController::class,'getMatieresSC']);
Route::get('/classesAvecSeries', [ClassesController::class,'getClasseWithSeries']);


//Route pour le fichier educMaster
Route::get('EducMasterFile', [BulletinController::class,'GenerateFile']);

//Route pour les contributions
Route::get('/contributions', [ContributionsController::class, 'index']);
Route::post('/contributions/store', [ContributionsController::class, 'store']);
Route::get('/contributions/{id}', [ContributionsController::class, 'show']);
Route::put('/contributions/{id}', [ContributionsController::class, 'update']);
Route::delete('/contributions/{id}', [ContributionsController::class, 'destroy']);

//Route pour les paiements
Route::prefix('cinetpay')->group(function () {
    Route::post('/init', [CinetPayController::class, 'initier'])->name('cinetpay.init');
    Route::get('/return',          [CinetPayController::class, 'retour'])->name('cinetpay.return');
    Route::post('/notify',         [CinetPayController::class, 'notifier'])->name('cinetpay.notify');
});

Route::post('test', fn () => response()->json(['ok' => true]));



Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['db' => 'OK']);
    } catch (\Exception $e) {
        return response()->json(['db' => 'KO', 'error' => $e->getMessage()], 500);
    }
});




// Routes pour les périodes
Route::get('/periodes/classe/{classeId}', [periodesController::class, 'getPeriodesByClasse']);
Route::get('/periodes/categorie/{categorie}', [periodesController::class, 'getPeriodesByCategorie']);
Route::get('/periodes/categorie/maternelle', [periodesController::class, 'getTypesByMaterlle']);
Route::get('/periodes/categorie/primaire', [periodesController::class, 'getTypesByPrimaire']);
Route::get('/periodes/categorie/secondaire', [periodesController::class, 'getTypesBySecondaire']);
Route::get('/periodes/active/categorie/{categorie}', [periodesController::class, 'getActivePeriodesByCategorie']);


// Routes pour les types d'évaluation
Route::get('/types-evaluation/classe/{classeId}', [typeEvaluationController::class, 'getTypesByClasse']);
Route::get('/types-evaluation/categorie/{categorie}', [typeEvaluationController::class, 'getTypesByCategorie']);
Route::get('/types-evaluation/categorie/maternelle', [typeEvaluationController::class, 'getTypesByMaterlle']);
Route::get('/types-evaluation/categorie/primaire', [typeEvaluationController::class, 'getTypesByPrimaire']);
Route::get('/types-evaluation/categorie/secondaire', [typeEvaluationController::class, 'getTypesBySecondaire']);
Route::get('/types-evaluation/active/categorie/tousavecseriesetclasses', [typeEvaluationController::class, 'getTypesWithPeriodesByClassesAndSeries']);
Route::get('/types-evaluation/with-periodes/classe/{classeId}', [typeEvaluationController::class, 'getTypesWithPeriodesByClasse']);
Route::get('/types-evaluation/with-periodes/categorie/{categorie}', [typeEvaluationController::class, 'getTypesWithPeriodesByCategorie']);