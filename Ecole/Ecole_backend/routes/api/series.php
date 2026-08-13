<?php

use App\Http\Controllers\SeriesController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Séries - Protégées par Sanctum
|--------------------------------------------------------------------------
|
| Contrat complet de SeriesController, exposé pour le front. Les routes
| « écriture » (CRUD, coefficients, affectations enseignants) sont réservées
| à la direction ; les lectures sont ouvertes à tout utilisateur authentifié,
| à l'exception des listings d'effectifs qui restent limités aux rôles
| pédagogiques (même règle que ClassesController::getEleves, cf. audit S15).
|
| IMPORTANT : les routes à segments statiques sont déclarées AVANT les routes
| paramétrées, sinon Laravel matcherait `/series/classes` sur `/series/{id}`.
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('series')->group(function () {

        // ===== Consultations globales (statiques, avant `/{id}`) =====
        Route::get('/classes', [SeriesController::class, 'Classe_avec_series']);
        Route::get('/classes-matieres', [SeriesController::class, 'getAllClassesWithSeriesAndMatieres']);

        Route::get('/eleve/{eleve_id}', [SeriesController::class, 'getSeriesByEleve']);
        Route::get('/matiere/{matiere_id}', [SeriesController::class, 'getSeriesByMatiere']);

        // Séries / matières d'une classe, et affectations enseignants par classe × série
        Route::get('/classe/{classe_id}', [SeriesController::class, 'getSeriesByClasse']);
        Route::get('/classe/{classeId}/serie/{serieId}/matieres', [SeriesController::class, 'getMatieresSC']);
        Route::post('/classe/{classeId}/serie/{serieId}/enseignants', [SeriesController::class, 'updateEnseignants'])
            ->middleware('role:directeur,admin');
        Route::post('/classe/{classeId}/enseignants-mp', [SeriesController::class, 'updateEnseignantsMP'])
            ->middleware('role:directeur,admin');

        // ===== CRUD =====
        Route::get('/', [SeriesController::class, 'index']);
        Route::post('/store', [SeriesController::class, 'store'])->middleware('role:directeur,admin');
        Route::get('/{id}', [SeriesController::class, 'show']);
        Route::post('/update/{id}', [SeriesController::class, 'update'])->middleware('role:directeur,admin');
        Route::delete('/delete/{id}', [SeriesController::class, 'destroy'])->middleware('role:directeur,admin');

        // ===== Élèves et matières d'une série =====
        Route::get('/{id}/eleves', [SeriesController::class, 'getEleves'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier,bibliothecaire');
        Route::get('/{id}/eleves-serie', [SeriesController::class, 'getEleves'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier,bibliothecaire');
        Route::get('/{id}/eleves/classe/{classe_id}', [SeriesController::class, 'getElevesByClasse'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier,bibliothecaire');
        Route::get('/{id}/eleves/matiere/{matiere_id}', [SeriesController::class, 'getElevesByMatiere'])
            ->middleware('role:directeur,enseignant,censeur,surveillant,secretaire,infirmier,bibliothecaire');

        Route::get('/{id}/matieres', [SeriesController::class, 'getMatieres']);
        Route::get('/{id}/matieres-serie', [SeriesController::class, 'getMatieres']);
        Route::get('/{id}/matieres/coefficients', [SeriesController::class, 'getMatieresWithCoefficients']);
        Route::get('/{id}/matieres/eleve/{eleve_id}', [SeriesController::class, 'getMatieresByEleve']);

        Route::get('/{id}/moyenne/{eleve_id}', [SeriesController::class, 'getMoyenneGeneraleByEleve'])
            ->middleware('role:directeur,enseignant,censeur,secretaire');

        // ===== Coefficient et composition des matières =====
        Route::post('/{id}/matieres', [SeriesController::class, 'attachMatiere'])->middleware('role:directeur,admin');
        Route::post('/{id}/matieres/sync', [SeriesController::class, 'syncMatieres'])->middleware('role:directeur,admin');
        Route::put('/{id}/matieres/{matiere_id}/coefficient', [SeriesController::class, 'updateMatiereCoefficient'])
            ->middleware('role:directeur,admin');
        Route::delete('/{id}/matieres/{matiere_id}', [SeriesController::class, 'detachMatiere'])
            ->middleware('role:directeur,admin');
    });
});
