<?php

use App\Http\Controllers\{
    EcoleController,
    CommunicationsController,
    ContributionsController,
    PaymentController,
    MessageController,
    NotificationController,
    ExerciceController,
    EvenementController,
    FedaPayController,
    PersonnelController,
    ExportController,
    TransportController
};
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Services et Utilitaires - Protégées par Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ============ ÉCOLES ============
    Route::post('ecoles/provision', [EcoleController::class, 'provision'])->middleware('role:super-admin');

    // Une école se désactive, elle ne se supprime jamais : ses dossiers élèves,
    // notes et historiques de paiement doivent rester auditables. DELETE sur la
    // ressource désactive (cf. EcoleController::destroy).
    Route::post('ecoles/{ecole}/deactivate', [EcoleController::class, 'deactivate'])->middleware('role:super-admin');
    Route::post('ecoles/{ecole}/activate', [EcoleController::class, 'activate'])->middleware('role:super-admin');
    Route::apiResource('ecoles', EcoleController::class)->middleware('role:directeur,super-admin');

    // ============ PERSONNEL & RH ============
    Route::prefix('personnel')->middleware('role:directeur')->group(function () {
        Route::get('/', [PersonnelController::class, 'index']);
        Route::post('/', [PersonnelController::class, 'store']);
        Route::post('/{id}/fiche-paie', [PersonnelController::class, 'genererFichePaie']);
    });

    // ============ EXPORTS & REPORTING ============
    Route::prefix('exports')->middleware(['role:directeur,comptable', 'throttle:exports'])->group(function () {
        Route::get('/eleves', [ExportController::class, 'exportEleves']);
        Route::get('/finances', [ExportController::class, 'exportFinances']);
    });

    // ============ TRANSPORT ============
    Route::prefix('transport')->group(function () {
        Route::get('/vehicules', [TransportController::class, 'listVehicules'])->middleware('role:directeur,surveillant');
        Route::get('/trajets', [TransportController::class, 'listTrajets'])->middleware('role:directeur,surveillant');
        Route::get('/abonnements', [TransportController::class, 'indexAbonnements'])->middleware('role:directeur,comptable');
        Route::post('/abonner', [TransportController::class, 'storeAbonnement'])->middleware('role:directeur');
        Route::post('/payer/{id}', [TransportController::class, 'payerTransport'])->middleware('role:directeur,comptable');
    });

    // ============ CONTRIBUTIONS ============
    Route::prefix('contributions')->middleware('role:directeur,comptable')->group(function () {
        Route::get('/', [ContributionsController::class, 'index']);
        Route::post('/store', [ContributionsController::class, 'store']);
        Route::get('/{id}', [ContributionsController::class, 'show']);
        Route::put('/{id}', [ContributionsController::class, 'update']);
        Route::delete('/{id}', [ContributionsController::class, 'destroy']);
    });

    // ============ PAIEMENTS ============
    Route::prefix('payments')->middleware('throttle:paiements')->group(function () {
        Route::post('/initialize', [PaymentController::class, 'initializePayment']);
        Route::get('/history', [PaymentController::class, 'getPaymentHistory']);
        Route::get('/stats', [PaymentController::class, 'getPaymentStats'])->middleware('role:directeur,comptable');
        Route::post('/mobile-money', [PaymentController::class, 'processMobileMoney']);
    });

    // ============ FEDAPAY ============
    Route::prefix('fedapay')->group(function () {
        Route::post('/init/{id}', [FedaPayController::class, 'initier']);
    });

    // ============ MESSAGERIE ============
    Route::prefix('messages')->group(function () {
        Route::get('/received', [MessageController::class, 'index']);
        Route::get('/sent', [MessageController::class, 'sent']);
        Route::get('/conversation/{contactId}', [MessageController::class, 'getConversation']);
        Route::post('/', [MessageController::class, 'store']);
        Route::put('/{id}/read', [MessageController::class, 'markAsRead']);

        // Ces trois méthodes existaient dans le contrôleur sans être exposées :
        // la page Messagerie appelait /messagerie/conversations, qui n'a jamais
        // existé, faute de route pour getConversations.
        Route::get('/conversations', [MessageController::class, 'getConversations']);
        Route::get('/unread-count', [MessageController::class, 'unreadCount']);
        Route::get('/contacts', [MessageController::class, 'getUsers']);
    });

    // ============ NOTIFICATIONS ============
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });

    // ============ COMMUNICATIONS ============
    //
    // Le tableau d'affichage de l'établissement. Aucune garde de rôle sur la
    // lecture : tout membre de l'école lit le fil, et *ce qu'il y lit* est
    // décidé par la règle d'audience dans la requête elle-même
    // (`Communication::scopeVisibleTo`), pas par le routeur. L'écriture est
    // gardée par `CommunicationPolicy` — plus fin qu'un `role:` puisqu'elle
    // distingue l'auteur d'un pair du même rôle.
    Route::apiResource('communications', CommunicationsController::class);

    // ============ ÉVÉNEMENTS ============
    Route::prefix('evenements')->group(function () {
        Route::get('/', [EvenementController::class, 'index'])->middleware('role:directeur,enseignant,surveillant,censeur');
        Route::post('/', [EvenementController::class, 'store'])->middleware('role:directeur');
        Route::delete('/{id}', [EvenementController::class, 'destroy'])->middleware('role:directeur');
    });

});

/*
|--------------------------------------------------------------------------
| Routes Publiques, Callbacks et Webhooks
|--------------------------------------------------------------------------
|
| Ces routes DOIVENT être nommées : le code appelle route('payment.callback')
| et route('api.fedapay.callback') pour construire les URL de retour envoyées
| au provider. Sans elles, `route()` levait une RouteNotFoundException et
| l'initialisation de paiement échouait systématiquement en 500 (audit F7).
|
*/

// Retour navigateur après paiement (le provider y redirige l'utilisateur)
Route::get('/payments/callback', [PaymentController::class, 'callback'])
    ->name('payment.callback');

Route::get('/fedapay/callback', [FedaPayController::class, 'callback'])
    ->name('api.fedapay.callback');

// Webhooks serveur-à-serveur (signature vérifiée dans le contrôleur)
Route::post('/payments/webhook', [PaymentController::class, 'webhook'])
    ->middleware('throttle:webhooks')
    ->name('payment.webhook');

Route::post('/fedapay/webhook', [FedaPayController::class, 'webhook'])
    ->middleware('throttle:webhooks')
    ->name('api.fedapay.webhook');

// Sonde de santé. Exposée aussi sous /api/v1/ (déclaré dans routes/api.php),
// les sondes d'infrastructure et les tests ciblant cette version.
Route::get('/health', fn() => response()->json([
    'status' => 'UP',
    'timestamp' => now()->toIso8601String(),
]))->name('health');
