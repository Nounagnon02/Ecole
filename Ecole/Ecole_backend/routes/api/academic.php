<?php

use App\Http\Controllers\Bulletin\BulletinController;
use App\Http\Controllers\BulletinsController;
use App\Http\Controllers\CahierDeTexteController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\DevoirController;
use App\Http\Controllers\EleveController;
use App\Http\Controllers\EmploiDuTempsController;
use App\Http\Controllers\MatieresController;
use App\Http\Controllers\MoyennesController;
use App\Http\Controllers\Notes\{
    NotesCrudController,
    NotesImportController,
    NotesStatsController,
    NotesQueryController,
};
use App\Http\Controllers\periodesController;
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

        // Affectation série/classe + coefficients
        Route::post('/{id}/series', [MatieresController::class, 'attachSeries'])->middleware('role:directeur,admin');
        Route::delete('/{id}/series/{serieId}', [MatieresController::class, 'detachSeries'])->middleware('role:directeur,admin');
        Route::get('/{id}/coefficients', [MatieresController::class, 'getCoefficients']);
    });

    // ============ CLASSES ============
    // La composition des classes n'est pas une donnée publique de l'école :
    // sans ces filtres, un élève listait tous les effectifs (cf. audit S15).
    Route::prefix('classes')->group(function () {
        Route::get('/', [ClassesController::class, 'index']);
        Route::post('/store', [ClassesController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ClassesController::class, 'show']);
        Route::get('/{id}/eleves', [ClassesController::class, 'getEleves'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier,bibliothecaire');
        Route::get('/{id}/enseignants', [ClassesController::class, 'getEnseignants'])
            ->middleware('role:directeur,enseignant,censeur,secretaire');
    });

    // ============ ÉLÈVES ============
    Route::prefix('eleves')->group(function () {
        Route::get('/', [EleveController::class, 'index'])->middleware('role:directeur,enseignant');
        Route::post('/store', [EleveController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [EleveController::class, 'show']); // ElevePolicy::view appliquée dans le contrôleur
        Route::put('/update/{id}', [EleveController::class, 'update'])->middleware('role:directeur');

        // Sortie et retour dans les effectifs. Il n'y a volontairement pas de
        // DELETE ici : un dossier d'élève ne se supprime pas (cf.
        // 2026_08_05_100100_restrict_student_deletion). Le DELETE que la surface
        // tenant expose via apiResource délègue à `deactivate`.
        Route::post('/{eleve}/deactivate', [EleveController::class, 'deactivate'])->middleware('role:directeur');
        Route::post('/{eleve}/activate', [EleveController::class, 'activate'])->middleware('role:directeur');

        // Espace Elève
        Route::get('/me/bulletin/{periode}', [EleveController::class, 'bulletin'])->middleware('role:eleve');
        Route::get('/me/emploi-du-temps', [EleveController::class, 'emploiDuTemps'])->middleware('role:eleve');
        // Les « cours » d'un élève = le cahier de texte de sa classe.
        Route::get('/me/cours', [EleveController::class, 'cours'])->middleware('role:eleve');
    });

    // ============ NOTES ============
    Route::prefix('notes')->group(function () {
        Route::get('/eleve/{eleveId?}', [NotesCrudController::class, 'index']);
        Route::post('/store', [NotesCrudController::class, 'store'])->middleware('role:directeur,enseignant');
        Route::post('/import', [NotesImportController::class, 'import'])->middleware(['role:directeur,enseignant', 'throttle:5,1']);
        Route::post('/import-csv', [NotesImportController::class, 'importCsv'])->middleware(['role:directeur,enseignant', 'throttle:5,1']);
        Route::post('/bulk', [NotesCrudController::class, 'bulkStore'])->middleware('role:directeur,enseignant');
        Route::get('/grille/{classeId}', [NotesCrudController::class, 'grilleSaisie'])->middleware('role:directeur,enseignant');
        Route::get('/export', [NotesImportController::class, 'export'])->middleware('role:directeur,enseignant');
        Route::post('/{id}/lock', [NotesCrudController::class, 'lock'])->middleware('role:directeur,enseignant');
        Route::post('/{id}/unlock', [NotesCrudController::class, 'unlock'])->middleware('role:directeur,enseignant');
        Route::get('/classement/{classeId}/{periode}', [NotesStatsController::class, 'classement'])->middleware('role:directeur,enseignant');
        // Agrégats appelés par le tableau de bord des notes, jusqu'ici absents.
        // Le périmètre est restreint dans le contrôleur selon le rôle.
        Route::get('/stats', [NotesStatsController::class, 'stats']);
        Route::get('/moyennes-par-matiere', [NotesStatsController::class, 'moyennesParMatiere']);
    });

    // ============ MOYENNES (instantané bulletin) ============
    // La table `moyennes` archive moyenne et rang par matière + moyenne
    // générale et rang général, par élève et par période, au verrouillage du
    // bulletin (POST /moyennes/recalculer). GET relit cet instantané.
    Route::prefix('moyennes')->group(function () {
        Route::get('/', [MoyennesController::class, 'index'])
            ->middleware('role:directeur,enseignant,censeur,parent,eleve');
        Route::post('/recalculer', [MoyennesController::class, 'recalculer'])
            ->middleware('role:directeur,enseignant');
    });

    // ============ BULLETINS (archives verrouillées) ============
    // POST /bulletins/verrouiller fige le bulletin d'une classe pour une
    // période (moyenne, rang, mention, détail par matière), GET /bulletins le
    // relit dans le périmètre du demandeur.
    Route::prefix('bulletins')->group(function () {
        Route::get('/', [BulletinsController::class, 'index'])
            ->middleware('role:directeur,enseignant,censeur,parent,eleve');
        Route::post('/verrouiller', [BulletinsController::class, 'verrouiller'])
            ->middleware('role:directeur,enseignant,censeur');
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
