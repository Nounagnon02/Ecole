<?php

use App\Http\Controllers\{
    EnseignantController,
    EnseignantsMaternellePrimaireController,
    ParentsController,
    ParentController,
    ComptableController,
    SurveillantController,
    CenseurController,
    InfirmierController,
    BibliothecaireController,
    SecretaireController,
    AuthController,
    ImportController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Publiques (sans authentification)
|--------------------------------------------------------------------------
*/

// Invitation parent - vérification token (public)
Route::get('/public/parent/invitation/{token}/verify', [ParentsController::class, 'verifyInvitation']);

// Inscription parent via invitation (public)
Route::post('/public/parent/accept-invitation', [ParentsController::class, 'acceptInvitation']);

// Auto-inscription parent (matricule + code secret)
Route::post('/public/parent/register', [ParentsController::class, 'register']);

/*
|--------------------------------------------------------------------------
| Routes Utilisateurs et Personnel - Protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ============ ENSEIGNANTS ============
    Route::prefix('enseignants')->group(function () {
        Route::get('/', [EnseignantController::class, 'index'])
            ->middleware('role:directeur,censeur,secretaire,enseignant');
        Route::get('/{id}', [EnseignantController::class, 'show'])
            ->middleware('role:directeur,censeur,secretaire,enseignant');
        Route::post('/store', [EnseignantController::class, 'store'])->middleware('role:directeur');
        Route::put('/update/{id}', [EnseignantController::class, 'update'])->middleware('role:directeur');
        Route::delete('/delete/{id}', [EnseignantController::class, 'destroy'])->middleware('role:directeur');

        // Affectations classe × série × matière. `/{id}` est enregistré avant
        // ces routes : les segments supplémentaires les rendent plus précises
        // et Laravel ne confond pas `/{id}` avec `/{id}/affectations`.
        Route::get('/{id}/affectations', [EnseignantController::class, 'affectations'])
            ->middleware('role:directeur,censeur,secretaire,enseignant');
        Route::post('/{id}/affectations', [EnseignantController::class, 'storeAffectations'])
            ->middleware('role:directeur');
        Route::delete('/{id}/affectations/{affectationId}', [EnseignantController::class, 'destroyAffectation'])
            ->middleware('role:directeur');
    });

    // ============ ENSEIGNANTS Maternelle / Primaire ============
    Route::prefix('enseignants-mp')->middleware('role:directeur,censeur,secretaire')->group(function () {
        Route::get('/', [EnseignantsMaternellePrimaireController::class, 'index']);
        Route::get('/{id}', [EnseignantsMaternellePrimaireController::class, 'show']);
        Route::post('/{id}/affectation', [EnseignantsMaternellePrimaireController::class, 'storeAffectation'])
            ->middleware('role:directeur');
    });

    // ============ ENSEIGNANT DASHBOARD ============
    Route::prefix('enseignant')->middleware('role:enseignant,directeur')->group(function () {
        Route::get('/classes', [EnseignantController::class, 'classes']);
        Route::get('/notes', [EnseignantController::class, 'notes']);
    });

    // ============ PARENTS ============
    // `{id}/eleves` révèle la filiation : réservé au personnel (cf. audit S15).
    Route::prefix('parents')->middleware('role:directeur,secretaire,censeur')->group(function () {
        Route::get('/', [ParentsController::class, 'index']);
        Route::post('/', [ParentsController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ParentsController::class, 'show']);
        Route::get('/{id}/eleves', [ParentsController::class, 'getElevesByParent']);
        // Lier/révoquer la filiation. Les deux endpoints valident chaque
        // `eleve_id` avec `school_exists`, sinon un directeur lierait les
        // enfants d'un autre établissement à ce parent.
        Route::put('/{id}/eleves', [ParentsController::class, 'updateEleves'])->middleware('role:directeur');
        Route::put('/{id}', [ParentsController::class, 'update'])->middleware('role:directeur');
        // Suppression douce du compte parent (directeur).
        Route::delete('/{id}', [ParentsController::class, 'destroy'])->middleware('role:directeur');
        
        // Gestion invitations parents
        Route::post('/invite', [ParentsController::class, 'invite']);
        Route::post('/{eleveId}/generate-code', [ParentsController::class, 'generateParentCode']);
    });

    // ============ PARENT DASHBOARD ============
    Route::prefix('parent')->middleware('role:parent')->group(function () {
        Route::get('/enfants', [ParentController::class, 'enfants']);
        Route::get('/bulletins', [ParentController::class, 'bulletins']);
        Route::get('/bulletin/{enfantId}/{periode}', [ParentController::class, 'bulletinDetail']);
        Route::get('/messages', [ParentController::class, 'messages']);
        Route::get('/rendez-vous', [ParentController::class, 'rendezVous']);

        // Sous-ressources par enfant. Chacune vérifie dans le contrôleur que
        // l'enfant appartient bien au parent connecté.
        Route::get('/enfants/{enfantId}/notes', [ParentController::class, 'enfantNotes']);
        Route::get('/enfants/{enfantId}/absences', [ParentController::class, 'enfantAbsences']);
        Route::get('/enfants/{enfantId}/emploi-du-temps', [ParentController::class, 'enfantEmploiDuTemps']);
        Route::get('/enfants/{enfantId}/paiements', [ParentController::class, 'enfantPaiements']);
    });

    // ============ COMPTABLE ============
    Route::prefix('comptable')->middleware('role:directeur,comptable')->group(function () {
        Route::get('/paiements', [ComptableController::class, 'paiements']);
        Route::get('/finances', [ComptableController::class, 'finances']);
        Route::get('/bourses', [ComptableController::class, 'bourses']);
        Route::post('/paiements', [ComptableController::class, 'storePaiement']);
        Route::post('/bourses', [ComptableController::class, 'storeBourse']);
        Route::get('/depenses', [ComptableController::class, 'depenses']);
        Route::post('/depenses', [ComptableController::class, 'storeDepense']);
        Route::delete('/depenses/{id}', [ComptableController::class, 'destroyDepense']);
        Route::get('/paiements/{id}/recu', [ComptableController::class, 'recu']);
        Route::get('/echeancier/{eleveId}', [ComptableController::class, 'echeancier']);
        // Paiement en ligne (FedaPay). Le nom de route `comptable.fedapay.callback`
        // est celui que FedaPayService renvoie au provider en `callback_url`.
        Route::post('/echeancier/{paiementId}/initier-paiement', [ComptableController::class, 'initierPaiementEcheance']);
        Route::get('/paiement/callback', [ComptableController::class, 'paiementCallback'])->name('comptable.fedapay.callback');
        Route::get('/paiement/verifier/{transactionId}', [ComptableController::class, 'verifierPaiement']);
    });

    // ============ SURVEILLANT ============
    Route::prefix('surveillant')->middleware('role:directeur,surveillant')->group(function () {
        Route::get('/absences', [SurveillantController::class, 'absences']);
        Route::post('/absences', [SurveillantController::class, 'storeAbsence']);
    });

    // ============ IMPORTS DE DONNÉES ============
    Route::prefix('imports')->middleware(['role:directeur', 'throttle:exports'])->group(function () {
        Route::post('/eleves', [ImportController::class, 'importEleves']);
    });

    // ============ CENSEUR ============
    Route::prefix('censeur')->middleware('role:directeur,censeur')->group(function () {
        Route::get('/resultats', [CenseurController::class, 'resultats']);
        Route::get('/conseils-classe', [CenseurController::class, 'conseilsClasse']);
        Route::get('/examens', [CenseurController::class, 'examens']);
        Route::post('/conseils-classe', [CenseurController::class, 'storeConseilClasse']);
        Route::put('/conseils-classe/{id}', [CenseurController::class, 'updateConseilClasse']);
        Route::delete('/conseils-classe/{id}', [CenseurController::class, 'destroyConseilClasse']);
        Route::post('/examens', [CenseurController::class, 'storeExamen']);
        Route::put('/examens/{id}', [CenseurController::class, 'updateExamen']);
        Route::delete('/examens/{id}', [CenseurController::class, 'destroyExamen']);
        Route::get('/stats-chart', [CenseurController::class, 'statsChart']);
        Route::get('/stats-periode', [CenseurController::class, 'statsPeriode']);
        Route::get('/rapport-classe/{classeId}', [CenseurController::class, 'rapportClasse']);
    });

    // ============ INFIRMIER ============
    Route::prefix('infirmier')->middleware('role:directeur,infirmier')->group(function () {
        Route::get('/consultations', [InfirmierController::class, 'consultations']);
        Route::get('/dossiers-medicaux', [InfirmierController::class, 'dossiersMedicaux']);
        Route::get('/vaccinations', [InfirmierController::class, 'vaccinations']);
        Route::get('/statistiques', [InfirmierController::class, 'statistiques']);
        Route::post('/consultations', [InfirmierController::class, 'storeConsultation']);
        Route::post('/dossiers-medicaux', [InfirmierController::class, 'storeDossierMedical']);
        Route::post('/vaccinations', [InfirmierController::class, 'storeVaccination']);
    });

    // ============ BIBLIOTHECAIRE ============
    Route::prefix('bibliothecaire')->middleware('role:directeur,bibliothecaire')->group(function () {
        Route::get('/livres', [BibliothecaireController::class, 'livres']);
        Route::get('/emprunts', [BibliothecaireController::class, 'emprunts']);
        Route::get('/reservations', [BibliothecaireController::class, 'reservations']);
        Route::get('/statistiques', [BibliothecaireController::class, 'statistiques']);
        Route::post('/livres', [BibliothecaireController::class, 'storeLivre']);
        Route::post('/emprunts', [BibliothecaireController::class, 'storeEmprunt']);
        Route::put('/emprunts/{id}/retour', [BibliothecaireController::class, 'retournerLivre']);
        Route::post('/reservations', [BibliothecaireController::class, 'storeReservation']);
        Route::put('/reservations/{id}/confirmer', [BibliothecaireController::class, 'confirmerReservation']);
    });

    // ============ SECRETAIRE ============
    Route::prefix('secretaire')->middleware('role:directeur,secretaire')->group(function () {
        Route::get('/dossiers-eleves', [SecretaireController::class, 'dossiersEleves']);
        Route::get('/rendez-vous', [SecretaireController::class, 'rendezVous']);
        Route::get('/certificats', [SecretaireController::class, 'certificats']);
        Route::get('/statistiques', [SecretaireController::class, 'statistiques']);
        Route::post('/rendez-vous', [SecretaireController::class, 'storeRendezVous']);
        Route::post('/certificats', [SecretaireController::class, 'storeCertificat']);
        Route::put('/certificats/{id}/delivrer', [SecretaireController::class, 'delivrerCertificat']);
        Route::get('/courriers', [SecretaireController::class, 'courriers']);
        Route::post('/dossiers', [SecretaireController::class, 'storeDossier']);
        Route::post('/courriers', [SecretaireController::class, 'storeCourrier']);
        Route::post('/visiteurs', [SecretaireController::class, 'storeVisiteur']);
    });

    // ============ SURVEILLANT (complément) ============
    Route::prefix('surveillant')->middleware('role:directeur,surveillant')->group(function () {
        Route::get('/incidents', [SurveillantController::class, 'incidents']);
        Route::post('/incidents', [SurveillantController::class, 'storeIncident']);
        Route::get('/sanctions', [SurveillantController::class, 'sanctions']);
        Route::post('/sanctions', [SurveillantController::class, 'storeSanction']);
        Route::get('/statistiques', [SurveillantController::class, 'statistiques']);
    });
});
