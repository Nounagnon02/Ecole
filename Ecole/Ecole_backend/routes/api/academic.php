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
        // (lecture ouverte : le référentiel matières est nécessaire à tous les rôles)
        Route::post('/store', [MatieresController::class, 'store'])->middleware('role:directeur,admin');
        Route::post('/update/{id}', [MatieresController::class, 'update'])->middleware('role:directeur,admin');
        Route::delete('/delete/{id}', [MatieresController::class, 'destroy'])->middleware('role:directeur,admin');
        
        Route::get('/niveaux/{niveau}', [MatieresController::class, 'getByNiveau']);
    });

    // ============ CLASSES ============
    // La composition des classes n'est pas une donnée publique de l'école :
    // sans ces filtres, un élève listait tous les effectifs (cf. audit S15).
    Route::prefix('classes')->group(function () {
        Route::get('/', [ClassesController::class, 'index']);
        Route::post('/store', [ClassesController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ClassesController::class, 'show']);
        Route::get('/{id}/eleves', [ClassesController::class, 'getEleves'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier');
    });

    // ============ ÉLÈVES ============
    Route::prefix('eleves')->group(function () {
        Route::get('/', [EleveController::class, 'index'])->middleware('role:directeur,enseignant');
        Route::post('/store', [EleveController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [EleveController::class, 'show']); // ElevePolicy::view appliquée dans le contrôleur
        Route::put('/update/{id}', [EleveController::class, 'update'])->middleware('role:directeur');
        
        // Espace Elève
        Route::get('/me/bulletin/{periode}', [EleveController::class, 'bulletin'])->middleware('role:eleve');
        Route::get('/me/emploi-du-temps', [EleveController::class, 'emploiDuTemps'])->middleware('role:eleve');
        // Les « cours » d'un élève = le cahier de texte de sa classe.
        Route::get('/me/cours', [EleveController::class, 'cours'])->middleware('role:eleve');
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
        // Agrégats appelés par le tableau de bord des notes, jusqu'ici absents.
        // Le périmètre est restreint dans le contrôleur selon le rôle.
        Route::get('/stats', [NotesController::class, 'stats']);
        Route::get('/moyennes-par-matiere', [NotesController::class, 'moyennesParMatiere']);
    });

    // ============ PÉRIODES ============
    //
    // Ces routes manquaient alors que periodesController et le modèle periodes
    // existent : deux pages du frontend appelaient GET /periodes dans le vide
    // (cf. ECARTS_FRONT_BACK.md).
    Route::prefix('periodes')->group(function () {
        Route::get('/', [periodesController::class, 'Index']);
        Route::get('/active', [periodesController::class, 'getActive']);
        Route::get('/classe/{classeId}', [periodesController::class, 'getPeriodesByClasse']);
        Route::get('/categorie/{categorie}', [periodesController::class, 'getPeriodesByCategorie']);
        Route::get('/categorie/{categorie}/active', [periodesController::class, 'getActivePeriodesByCategorie']);
        Route::post('/store', [periodesController::class, 'store'])->middleware('role:directeur');
        Route::post('/{id}/active', [periodesController::class, 'setActive'])->middleware('role:directeur');
    });

    // ============ BULLETINS ============
    Route::get('/bulletins/eleve/{eleveId}/{periode}', [BulletinController::class, 'getBulletin'])->middleware('role:directeur,parent,eleve');

    // ============ CAHIER DE TEXTE ============
    Route::prefix('cahier-texte')->group(function () {
        Route::get('/', [CahierDeTexteController::class, 'index'])
            ->middleware('role:directeur,enseignant,censeur,eleve,parent');
        Route::post('/', [CahierDeTexteController::class, 'store'])->middleware('role:enseignant,directeur');
        Route::get('/classe/{classeId}', [CahierDeTexteController::class, 'getByClasse'])
            ->middleware('role:directeur,enseignant,censeur,eleve,parent');
    });

    // ============ EMPLOI DU TEMPS ============
    Route::prefix('emploi-du-temps')->group(function () {
        Route::get('/', [EmploiDuTempsController::class, 'index'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,eleve,parent');
        Route::post('/store', [EmploiDuTempsController::class, 'store'])->middleware('role:directeur');
        Route::put('/update/{id}', [EmploiDuTempsController::class, 'update'])->middleware('role:directeur');
        Route::delete('/delete/{id}', [EmploiDuTempsController::class, 'destroy'])->middleware('role:directeur');
        Route::get('/classe/{classeId}', [EmploiDuTempsController::class, 'getByClasse'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,eleve,parent');
    });

    // ============ DEVOIRS ============
    Route::prefix('devoirs')->group(function () {
        Route::get('/enseignant', [DevoirController::class, 'indexEnseignant'])->middleware('role:directeur,enseignant');
        Route::get('/eleve', [DevoirController::class, 'indexEleve'])->middleware('role:eleve,parent');
        Route::post('/', [DevoirController::class, 'store'])->middleware('role:directeur,enseignant');
        Route::get('/{id}', [DevoirController::class, 'show'])->middleware('role:directeur,enseignant,eleve,parent');
        Route::post('/{id}/soumettre', [DevoirController::class, 'soumettre'])->middleware('role:eleve');
        Route::get('/{id}/copie/{eleveId}', [DevoirController::class, 'downloadSubmission'])->middleware('role:directeur,enseignant,censeur,eleve');
        Route::post('/{id}/noter/{eleveId}', [DevoirController::class, 'noter'])->middleware('role:directeur,enseignant');
        Route::delete('/{id}', [DevoirController::class, 'destroy'])->middleware('role:directeur,enseignant');
    });

});
