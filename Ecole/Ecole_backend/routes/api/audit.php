<?php

use App\Http\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Journal d'audit — consultation
|--------------------------------------------------------------------------
|
| `AuditLog` est alimenté depuis longtemps (`Auditable` sur `User` et
| `Notes`) mais n'était jamais consultable au-delà d'un widget de 10
| entrées sur le dashboard admin. Réservé aux rôles qui gèrent
| l'établissement -- pas aux rôles staff (comptable, surveillant...), qui
| n'ont pas à voir qui a modifié quoi ailleurs dans l'école.
|
*/

Route::middleware(['auth:sanctum', 'role:directeur,admin,super-admin'])->group(function () {
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});
