<?php

use App\Http\Controllers\{
    EcoleController,
    ContributionsController,
    PaymentController,
    MessageController,
    NotificationController,
    ExerciceController,
    NoteController,
    EvenementController
};
use Illuminate\Support\Facades\{Route, DB};

/*
|--------------------------------------------------------------------------
| Routes Services et Utilitaires
|--------------------------------------------------------------------------
|
| Routes diverses : écoles, paiements, messagerie, contributions, etc.
|
*/

// ============ ÉCOLES ============
Route::apiResource('ecoles', EcoleController::class);

// ============ CONTRIBUTIONS ============
Route::prefix('contributions')->group(function () {
    Route::get('/', [ContributionsController::class, 'index']);
    Route::post('/store', [ContributionsController::class, 'store']);
    Route::get('/{id}', [ContributionsController::class, 'show']);
    Route::put('/{id}', [ContributionsController::class, 'update']);
    Route::delete('/{id}', [ContributionsController::class, 'destroy']);
});

// ============ PAIEMENTS ============
Route::prefix('payments')->group(function () {
    Route::post('/initialize', [PaymentController::class, 'initializePayment']);
    Route::post('/mobile-money', [PaymentController::class, 'processMobileMoney']);
    Route::get('/history', [PaymentController::class, 'getPaymentHistory']);
    Route::get('/stats', [PaymentController::class, 'getPaymentStats']);
    Route::post('/refund/request', [PaymentController::class, 'requestRefund']);
    Route::post('/refund/process', [PaymentController::class, 'processRefund']);
    Route::get('/export', [PaymentController::class, 'exportPayments']);
    Route::get('/status', [PaymentController::class, 'checkStatus']);
    Route::get('/callback', [PaymentController::class, 'callback'])->name('payment.callback');
    Route::post('/webhook', [PaymentController::class, 'webhook']);
});

// ============ FEDAPAY ============
Route::prefix('fedapay')->group(function () {
    Route::post('/init/{id}', [\App\Http\Controllers\FedaPayController::class, 'initier']);
    Route::post('/callback', [\App\Http\Controllers\FedaPayController::class, 'callback'])->name('api.fedapay.callback');
});

// ============ MESSAGERIE ============
Route::prefix('messages')->group(function () {
    Route::get('/received', [MessageController::class, 'index']);
    Route::get('/sent', [MessageController::class, 'sent']);
    Route::get('/conversations', [MessageController::class, 'getConversations']);
    Route::get('/conversation/{contactId}', [MessageController::class, 'getConversation']);
    Route::post('/', [MessageController::class, 'store']);
    Route::put('/{id}/read', [MessageController::class, 'markAsRead']);
    Route::get('/unread-count', [MessageController::class, 'unreadCount']);
    Route::get('/users', [MessageController::class, 'getUsers']);
});

// ============ NOTIFICATIONS ============
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('/', [NotificationController::class, 'store']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

// ============ EXERCICES ============
Route::prefix('exercices')->group(function () {
    Route::get('/', [ExerciceController::class, 'index']);
    Route::post('/', [ExerciceController::class, 'store']);
    Route::put('/{id}', [ExerciceController::class, 'update']);
    Route::delete('/{id}', [ExerciceController::class, 'destroy']);
});

// ============ ÉVÉNEMENTS ============
Route::prefix('evenements')->group(function () {
    Route::get('/', [EvenementController::class, 'index']);
    Route::post('/', [EvenementController::class, 'store']);
    Route::get('/{id}', [EvenementController::class, 'show']);
    Route::put('/{id}', [EvenementController::class, 'update']);
    Route::delete('/{id}', [EvenementController::class, 'destroy']);
});

// ============ GESTION DES NOTES ============
Route::prefix('notes-management')->group(function () {
    Route::post('/', [NoteController::class, 'store']);
    Route::get('/eleve/{eleveId}', [NoteController::class, 'getByEleve']);
    Route::get('/classe/{classeId}', [NoteController::class, 'getByClasse']);
});

// ============ HEALTH & DEBUG ============
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['db' => 'OK']);
    } catch (\Exception $e) {
        return response()->json(['db' => 'KO', 'error' => $e->getMessage()], 500);
    }
});

Route::get('/test-simple', function () {
    return response()->json([
        'message' => 'API fonctionne',
        'timestamp' => now(),
        'env' => app()->environment(),
    ]);
})->middleware('api');

Route::get('/test-connexion', function () {
    return 'ok';
});

Route::post('test', fn () => response()->json(['ok' => true]));

Route::get('/test-db', function () {
    try {
        $connection = DB::connection();
        $connection->getPdo();
        $result = DB::select('SELECT 1 as test');

        return response()->json([
            'database' => 'Connexion réussie',
            'driver' => config('database.default'),
            'host' => config('database.connections.' . config('database.default') . '.host'),
            'port' => config('database.connections.' . config('database.default') . '.port'),
            'database_name' => config('database.connections.' . config('database.default') . '.database'),
            'test_query' => $result,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Erreur de connexion DB',
            'message' => $e->getMessage(),
            'config' => [
                'driver' => config('database.default'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'port' => config('database.connections.' . config('database.default') . '.port'),
            ]
        ], 500);
    }
})->middleware('api');
