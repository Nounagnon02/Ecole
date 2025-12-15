<?php

use App\Http\Controllers\{
    EnseignantController,
    ParentsController,
    ParentController,
    ComptableController,
    SurveillantController,
    CenseurController,
    InfirmierController,
    BibliothecaireController,
    SecretaireController,
    AuthController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Utilisateurs et Personnel
|--------------------------------------------------------------------------
|
| Routes pour la gestion des utilisateurs par rôle : enseignants, parents,
| personnel administratif et autres acteurs de l'école.
|
*/

// ============ ENSEIGNANTS ============
Route::prefix('enseignants')->group(function () {
    Route::get('/', [EnseignantController::class, 'index']); // consolidated
    Route::get('/mp', [EnseignantController::class, 'getEnseignantsMP']); // consolidated
    Route::get('/{id}', [AuthController::class, 'getEnseignantById']);
    Route::post('/store', [AuthController::class, 'storeEnseignant']);
    Route::put('/update/{id}', [AuthController::class, 'updateEnseignant']);
    Route::delete('/delete/{id}', [AuthController::class, 'destroyEnseignant']);
    
    // Effectifs par niveau
    Route::get('/effectif/maternelle', [EnseignantController::class, 'getEffectifMaternelle']);
    Route::get('/effectif/primaire', [EnseignantController::class, 'getEffectifPrimaire']);
    Route::get('/effectif/secondaire', [EnseignantController::class, 'getEffectifSecondaire']);
    
    // Classes et emploi du temps d'un enseignant
    Route::get('/{id}/classes', [EnseignantController::class, 'getClasses']);
    Route::get('/{id}/emploi-temps', [EnseignantController::class, 'getEmploiTemps']);
});

Route::prefix('enseignant')->group(function () {
    Route::get('/classes', [EnseignantController::class, 'classes']);
    Route::get('/notes', [EnseignantController::class, 'notes']);
});

// ============ PARENTS ============
Route::prefix('parents')->group(function () {
    Route::get('/', [ParentsController::class, 'index']);
    Route::post('/', [ParentsController::class, 'store']);
    Route::get('/{id}', [ParentsController::class, 'show']);
    Route::put('/{id}', [ParentsController::class, 'update']);
    Route::delete('/{id}', [ParentsController::class, 'destroy']);
    Route::get('/{id}/dashboard', [ParentsController::class, 'getDashboardData']);
    Route::get('/{id}/eleves', [ParentsController::class, 'getElevesByParent']);
    Route::put('/{id}/eleves', [ParentsController::class, 'updateEleves']);
});

Route::prefix('parent')->group(function () {
    Route::get('/enfants', [ParentController::class, 'enfants']);
    Route::get('/bulletins', [ParentController::class, 'bulletins']);
    Route::get('/bulletin/{enfantId}/{periode}', [ParentController::class, 'bulletin']);
    Route::get('/messages', [ParentController::class, 'messages']);
    Route::get('/rendez-vous', [ParentController::class, 'rendezVous']);
    Route::put('/update/{id}', [ParentsController::class, 'update']);
    Route::delete('/delete/{id}', [ParentsController::class, 'destroy']);
});

// ============ COMPTABLE ============
Route::prefix('comptable')->group(function () {
    Route::get('/paiements', [ComptableController::class, 'paiements']);
    Route::get('/finances', [ComptableController::class, 'finances']);
    Route::get('/bourses', [ComptableController::class, 'bourses']);
    Route::post('/paiements', [ComptableController::class, 'storePaiement']);
    Route::post('/bourses', [ComptableController::class, 'storeBourse']);
});

// ============ SURVEILLANT ============
Route::prefix('surveillant')->group(function () {
    Route::get('/absences', [SurveillantController::class, 'absences']);
    Route::get('/incidents', [SurveillantController::class, 'incidents']);
    Route::get('/sanctions', [SurveillantController::class, 'sanctions']);
    Route::post('/absences', [SurveillantController::class, 'storeAbsence']);
    Route::post('/incidents', [SurveillantController::class, 'storeIncident']);
    Route::post('/sanctions', [SurveillantController::class, 'storeSanction']);
});

// ============ CENSEUR ============
Route::prefix('censeur')->group(function () {
    Route::get('/resultats', [CenseurController::class, 'resultats']);
    Route::get('/conseils-classe', [CenseurController::class, 'conseilsClasse']);
    Route::get('/examens', [CenseurController::class, 'examens']);
    Route::get('/stats-chart', [CenseurController::class, 'statsChart']);
    Route::post('/conseils-classe', [CenseurController::class, 'storeConseilClasse']);
    Route::post('/examens', [CenseurController::class, 'storeExamen']);
});

// ============ INFIRMIER ============
Route::prefix('infirmier')->group(function () {
    Route::get('/consultations', [InfirmierController::class, 'consultations']);
    Route::get('/dossiers-medicaux', [InfirmierController::class, 'dossiersMedicaux']);
    Route::get('/vaccinations', [InfirmierController::class, 'vaccinations']);
    Route::get('/statistiques', [InfirmierController::class, 'statistiques']);
    Route::post('/consultations', [InfirmierController::class, 'storeConsultation']);
    Route::post('/dossiers-medicaux', [InfirmierController::class, 'storeDossierMedical']);
    Route::post('/vaccinations', [InfirmierController::class, 'storeVaccination']);
});

// ============ BIBLIOTHÉCAIRE ============
Route::prefix('bibliothecaire')->group(function () {
    Route::get('/livres', [BibliothecaireController::class, 'livres']);
    Route::get('/emprunts', [BibliothecaireController::class, 'emprunts']);
    Route::get('/reservations', [BibliothecaireController::class, 'reservations']);
    Route::get('/statistiques', [BibliothecaireController::class, 'statistiques']);
    Route::post('/livres', [BibliothecaireController::class, 'storeLivre']);
    Route::post('/emprunts', [BibliothecaireController::class, 'storeEmprunt']);
    Route::post('/reservations', [BibliothecaireController::class, 'storeReservation']);
    Route::put('/emprunts/{id}/retour', [BibliothecaireController::class, 'retournerLivre']);
    Route::put('/reservations/{id}/confirmer', [BibliothecaireController::class, 'confirmerReservation']);
});

// ============ SECRÉTAIRE ============
Route::prefix('secretaire')->group(function () {
    Route::get('/dossiers', [SecretaireController::class, 'dossiersEleves']);
    Route::get('/dossiers-eleves', [SecretaireController::class, 'dossiersEleves']);
    Route::get('/rendez-vous', [SecretaireController::class, 'rendezVous']);
    Route::get('/courriers', [SecretaireController::class, 'courriers']);
    Route::get('/certificats', [SecretaireController::class, 'certificats']);
    Route::get('/statistiques', [SecretaireController::class, 'statistiques']);
    Route::post('/rendez-vous', [SecretaireController::class, 'storeRendezVous']);
    Route::post('/certificats', [SecretaireController::class, 'storeCertificat']);
    Route::put('/certificats/{id}/delivrer', [SecretaireController::class, 'delivrerCertificat']);
});

// Routes directes secrétaire (hors prefix)
Route::post('/dossiers-eleves', [SecretaireController::class, 'storeDossier']);
Route::post('/courriers', [SecretaireController::class, 'storeCourrier']);
Route::post('/visiteurs', [SecretaireController::class, 'storeVisiteur']);
