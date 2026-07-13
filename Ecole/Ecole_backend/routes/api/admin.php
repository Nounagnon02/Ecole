<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Administrateur — Super Admin uniquement
|--------------------------------------------------------------------------
|
| Gestion centralisée de la plateforme multi-tenant : utilisateurs,
| écoles, configurations, logs système.
|
*/

Route::middleware(['auth:sanctum', 'role:admin,super-admin'])->prefix('admin')->group(function () {

    // ============ UTILISATEURS ============
    Route::get('/utilisateurs', [AdminController::class, 'utilisateurs']);
    Route::get('/utilisateurs/{id}', [AdminController::class, 'show']);
    Route::post('/utilisateurs/{id}/toggle-status', [AdminController::class, 'toggleStatus']);
    Route::delete('/utilisateurs/{id}', [AdminController::class, 'destroy']);
});
