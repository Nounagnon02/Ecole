<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EcoleController;

// Routes publiques pour lister les écoles (pour le login)
Route::get('/ecoles', [EcoleController::class, 'index']);

// Routes protégées pour gérer les écoles
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/ecoles', [EcoleController::class, 'store']);
    Route::get('/ecoles/{ecole}', [EcoleController::class, 'show']);
    Route::put('/ecoles/{ecole}', [EcoleController::class, 'update']);
    Route::delete('/ecoles/{ecole}', [EcoleController::class, 'destroy']);
    Route::get('/ecoles/{ecole}/stats', [EcoleController::class, 'stats']);
});
