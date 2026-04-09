<?php

use App\Http\Controllers\{
    EcoleController,
    ContributionsController,
    PaymentController,
    MessageController,
    NotificationController,
    ExerciceController,
    NoteController,
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
    Route::apiResource('ecoles', EcoleController::class)->middleware('role:directeur,super-admin');

    // ============ PERSONNEL & RH ============
    Route::prefix('personnel')->middleware('role:directeur')->group(function () {
        Route::get('/', [PersonnelController::class, 'index']);
        Route::post('/', [PersonnelController::class, 'store']);
        Route::post('/{id}/fiche-paie', [PersonnelController::class, 'genererFichePaie']);
    });

    // ============ EXPORTS & REPORTING ============
    Route::prefix('exports')->middleware('role:directeur,comptable')->group(function () {
        Route::get('/eleves', [ExportController::class, 'exportEleves']);
        Route::get('/finances', [ExportController::class, 'exportFinances']);
    });

    // ============ TRANSPORT ============
    Route::prefix('transport')->group(function () {
        Route::get('/vehicules', [TransportController::class, 'listVehicules']);
        Route::get('/trajets', [TransportController::class, 'listTrajets']);
        Route::get('/abonnements', [TransportController::class, 'indexAbonnements'])->middleware('role:directeur,comptable');
        Route::post('/abonner', [TransportController::class, 'storeAbonnement'])->middleware('role:directeur');
        Route::post('/payer/{id}', [TransportController::class, 'payerTransport'])->middleware('role:directeur,comptable');
    });

    // ============ CONTRIBUTIONS ============
    Route::prefix('contributions')->group(function () {
        Route::get('/', [ContributionsController::class, 'index']);
        Route::post('/store', [ContributionsController::class, 'store'])->middleware('role:directeur');
        Route::get('/{id}', [ContributionsController::class, 'show']);
        Route::put('/{id}', [ContributionsController::class, 'update'])->middleware('role:directeur');
        Route::delete('/{id}', [ContributionsController::class, 'destroy'])->middleware('role:directeur');
    });

    // ============ PAIEMENTS ============
    Route::prefix('payments')->group(function () {
        Route::post('/initialize', [PaymentController::class, 'initializePayment']);
        Route::get('/history', [PaymentController::class, 'getPaymentHistory']);
        Route::get('/stats', [PaymentController::class, 'getPaymentStats'])->middleware('role:directeur,comptable');
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
    });

    // ============ NOTIFICATIONS ============
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });

    // ============ ÉVÉNEMENTS ============
    Route::prefix('evenements')->group(function () {
        Route::get('/', [EvenementController::class, 'index']);
        Route::post('/', [EvenementController::class, 'store'])->middleware('role:directeur');
        Route::delete('/{id}', [EvenementController::class, 'destroy'])->middleware('role:directeur');
    });

});

// Routes Publiques ou Webhooks
Route::post('/fedapay/webhook', [FedaPayController::class, 'webhook']);
Route::get('/health', fn() => response()->json(['status' => 'UP']));
