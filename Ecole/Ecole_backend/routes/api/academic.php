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
    EmploiDuTempsController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Académiques
|--------------------------------------------------------------------------
|
| Routes pour la gestion académique : classes, matières, séries, élèves, notes.
| Organisées par entité pour faciliter la maintenance.
|
*/

// ============ MATIÈRES ============
Route::prefix('matieres')->group(function () {
    Route::get('/', [MatieresController::class, 'index']);
    Route::post('/store', [MatieresController::class, 'store']);
    Route::post('/update/{id}', [MatieresController::class, 'update']);
    Route::delete('/delete/{id}', [MatieresController::class, 'destroy']);
    
    // Par niveau
    Route::get('/maternelle', [MatieresController::class, 'getMatieresM']);
    Route::get('/primaire', [MatieresController::class, 'getMatieresP']);
    Route::get('/secondaire', [MatieresController::class, 'getMatieresS']);
});



// ============ CLASSES ============
Route::prefix('classes')->group(function () {
    Route::get('/', [ClassesController::class, 'index']);
    Route::post('/store', [ClassesController::class, 'store']);
    Route::put('/update/{id}', [ClassesController::class, 'update']);
    Route::delete('/delete/{id}', [ClassesController::class, 'destroy']);
    Route::get('/{id}', [ClassesController::class, 'show']);
    Route::get('/{id}/eleves', [ClassesController::class, 'getEleves']);
    Route::get('/{id}/matieres', [ClassesController::class, 'getMatieres']);
    Route::post('/{id}/matieres', [ClassesController::class, 'attachMatieres']);
    
    // Par niveau
    Route::get('/niveau/secondaire', [ClassesController::class, 'indexS']);
    Route::get('/niveau/maternelle', [ClassesController::class, 'getClassesM']);
    Route::get('/niveau/primaire', [ClassesController::class, 'getClassesP']);
    Route::get('/niveau/secondaire-list', [ClassesController::class, 'getClassesS']);
    
    // Effectifs par niveau
    Route::get('/effectif/maternelle', [ClassesController::class, 'getEffectifMaternelle']);
    Route::get('/effectif/primaire', [ClassesController::class, 'getEffectifPrimaire']);
    Route::get('/effectif/secondaire', [ClassesController::class, 'getEffectifSecondaire']);
    
    // Effectifs par classe
    Route::get('/effectif-par-classe/maternelle', [ClassesController::class, 'getClassesWithEffectifM']);
    Route::get('/effectif-par-classe/primaire', [ClassesController::class, 'getClassesWithEffectifP']);
    Route::get('/effectif-par-classe/secondaire', [ClassesController::class, 'getClassesWithEffectifS']);
    
    // Séries
    Route::get('/{id}/series', [ClassesController::class, 'getSeries']);
    Route::put('/{id}/series', [ClassesController::class, 'updateSeries']);
    Route::get('/{classId}/series/{serieId}/matieres', [ClassesController::class, 'getSeriesMatieres']);
    Route::put('/{classId}/series/{serieId}/matieres', [ClassesController::class, 'updateSeriesMatieres']);
});



// ============ SÉRIES ============
Route::prefix('series')->group(function () {
    Route::get('/', [SeriesController::class, 'index']);
    Route::post('/', [SeriesController::class, 'store']);
    Route::get('/{id}', [SeriesController::class, 'show']);
    Route::put('/{id}', [SeriesController::class, 'update']);
    Route::delete('/{id}', [SeriesController::class, 'destroy']);
    
    // Matières d'une série
    Route::get('/{id}/matieres', [SeriesController::class, 'getMatieres']);
    Route::get('/{id}/matieres/coefficients', [SeriesController::class, 'getMatieresWithCoefficients']);
    Route::post('/{id}/matieres', [SeriesController::class, 'attachMatiere']);
    Route::put('/{id}/matieres/sync', [SeriesController::class, 'syncMatieres']);
    Route::put('/{id}/matieres/{matiere_id}', [SeriesController::class, 'updateMatiereCoefficient']);
    Route::delete('/{id}/matieres/{matiere_id}', [SeriesController::class, 'detachMatiere']);
    
    // Élèves d'une série
    Route::get('/{id}/eleves', [SeriesController::class, 'getEleves']);
    Route::get('/{id}/eleves/matiere/{matiere_id}', [SeriesController::class, 'getElevesByMatiere']);
    Route::get('/{id}/eleves/classe/{classe_id}', [SeriesController::class, 'getElevesByClasse']);
    Route::get('/{id}/matieres/eleve/{eleve_id}', [SeriesController::class, 'getMatieresByEleve']);
    
    // Relations inverses
    Route::get('/by-eleve/{eleve_id}', [SeriesController::class, 'getSeriesByEleve']);
    Route::get('/by-classe/{classe_id}', [SeriesController::class, 'getSeriesByClasse']);
    Route::get('/by-matiere/{matiere_id}', [SeriesController::class, 'getSeriesByMatiere']);
});

Route::get('/classes/{classeId}/series/{serieId}/matieres', [SeriesController::class, 'getMatieresSC']);
Route::put('/classes/{classeId}/series/{serieId}/matieres/enseignants', [SeriesController::class, 'updateEnseignants']);
Route::put('/classes/{classeId}/enseignantsMP', [SeriesController::class, 'updateEnseignantsMP']);

// ============ ÉLÈVES ============
Route::prefix('eleves')->group(function () {
    Route::get('/', [EleveController::class, 'index']);
    Route::post('/store', [EleveController::class, 'store']);
    Route::get('/{id}', [EleveController::class, 'show']);
    Route::put('/update/{id}', [EleveController::class, 'update']);
    Route::delete('/delete/{id}', [EleveController::class, 'destroy']);
    
    // Par niveau
    Route::get('/niveau/maternelle', [EleveController::class, 'getElevesMaternelle']);
    Route::get('/niveau/primaire', [EleveController::class, 'getElevesPrimaire']);
    Route::get('/niveau/secondaire', [EleveController::class, 'getElevesSecondaire']);
    
    // Listes par classe
    Route::get('/liste-par-classe/maternelle', [EleveController::class, 'getElevesByClasseMaternelle']);
    Route::get('/liste-par-classe/primaire', [EleveController::class, 'getElevesByClassePrimaire']);
    Route::get('/liste-par-classe/secondaire', [EleveController::class, 'getElevesByClasseSecondaire']);
    
    // Dashboard élève
    Route::get('/bulletin/{periode}', [EleveController::class, 'bulletin']);
    Route::get('/exercices', [EleveController::class, 'exercices']);
    Route::get('/emploi-du-temps', [EleveController::class, 'emploiDuTemps']);
});

// Routes aliases pour compatibilité
Route::get('/elevesT', [EleveController::class, 'getEleves']);
Route::get('/elevesM', [EleveController::class, 'getElevesMaternelle']);
Route::get('/elevesP', [EleveController::class, 'getElevesPrimaire']);
Route::get('/elevesS', [EleveController::class, 'getElevesSecondaire']);

// ============ NOTES ============
Route::prefix('notes')->group(function () {
    Route::get('/filter', [NotesController::class, 'filter']);
    Route::get('/filter/maternelle', [NotesController::class, 'filterMaternelle']);
    Route::get('/filter/primaire', [NotesController::class, 'filterPrimaire']);
    Route::get('/filter/secondaire', [NotesController::class, 'filterSecondaire']);
    
    Route::post('/', [NotesController::class, 'store']);
    Route::get('/{id}', [NotesController::class, 'show']);
    Route::put('/{id}', [NotesController::class, 'update']);
    Route::delete('/{id}', [NotesController::class, 'destroy']);
    Route::post('/import', [NotesController::class, 'import']);
    
    // Données de référence
    Route::get('/data/classes', [NotesController::class, 'getClasses']);
    Route::get('/data/matieres', [NotesController::class, 'getMatieres']);
    Route::get('/data/eleves/{classe_id}', [NotesController::class, 'getElevesByClasse']);
    
    // Notes par élève
    Route::get('/eleve/{eleveId}/{periode?}', [NotesController::class, 'getNotesEleve']);
    Route::get('/statistiques/{eleveId}/{periode}', [NotesController::class, 'getStatistiquesEleve']);
    Route::get('/check/{eleveId}/{matiereId}/{typeEvaluation}/{periode}', [NotesController::class, 'checkNotesRestantes']);
});

// ============ BULLETINS ============
Route::get('/eleves/{childId}/bulletin', [BulletinController::class, 'getBulletin']);
Route::get('/EducMasterFile', [BulletinController::class, 'GenerateFile']);
Route::get('/debug/bulletin/{eleveId}/{periode}', [BulletinController::class, 'debugBulletin']);

// ============ PÉRIODES & TYPES D'ÉVALUATION ============
Route::prefix('periodes')->group(function () {
    Route::get('/', [periodesController::class, 'index']);
    Route::post('/store', [periodesController::class, 'store']);
    Route::post('/{id}/active', [periodesController::class, 'setActive']);
    Route::get('/classe/{classeId}', [periodesController::class, 'getPeriodesByClasse']);
    Route::get('/categorie/{categorie}', [periodesController::class, 'getPeriodesByCategorie']);
    Route::get('/active/categorie/{categorie}', [periodesController::class, 'getActivePeriodesByCategorie']);
});

Route::prefix('types-evaluation')->group(function () {
    Route::get('/', [typeEvaluationController::class, 'index']);
    Route::post('/store', [typeEvaluationController::class, 'store']);
    Route::get('/classe/{classeId}', [typeEvaluationController::class, 'getTypesByClasse']);
    Route::get('/categorie/{categorie}', [typeEvaluationController::class, 'getTypesByCategorie']);
    Route::get('/with-periodes/classe/{classeId}', [typeEvaluationController::class, 'getTypesWithPeriodesByClasse']);
    Route::get('/with-periodes/categorie/{categorie}', [typeEvaluationController::class, 'getTypesWithPeriodesByCategorie']);
    Route::get('/consolidated', [typeEvaluationController::class, 'getTypesWithPeriodesByClassesAndSeries']);
});



// ============ EMPLOI DU TEMPS ============
Route::prefix('emplois-du-temps')->group(function () {
    Route::get('/', [EmploiDuTempsController::class, 'index']);
    Route::post('/', [EmploiDuTempsController::class, 'store']);
    Route::put('/{id}', [EmploiDuTempsController::class, 'update']);
    Route::delete('/{id}', [EmploiDuTempsController::class, 'destroy']);
    Route::get('/classe/{classeId}', [EmploiDuTempsController::class, 'getByClasse']);
});

// ============ STATISTIQUES ============
Route::prefix('stats')->group(function () {
    Route::get('/effectifs', [EleveController::class, 'evolutionEffectifs']);
    Route::get('/effectifs-maternelle', [EleveController::class, 'evolutionEffectifsMaternelle']);
    Route::get('/effectifs-primaire', [EleveController::class, 'evolutionEffectifsPrimaire']);
    Route::get('/effectifs-secondaire', [EleveController::class, 'evolutionEffectifsSecondaire']);
    
    Route::get('/repartition-notes', [NotesController::class, 'repartitionNotes']);
    Route::get('/repartition-notes-maternelle', [NotesController::class, 'repartitionNotesMaternelle']);
    Route::get('/repartition-notes-primaire', [NotesController::class, 'repartitionNotesPrimaire']);
    Route::get('/repartition-notes-secondaire', [NotesController::class, 'repartitionNotesSecondaire']);
});
