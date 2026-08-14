<?php

use App\Http\Controllers\Api\AIController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes IA — EduPilot
|--------------------------------------------------------------------------
|
| Ces routes ne vivaient que dans routes/tenant.php, derrière
| PreventAccessFromCentralDomains : elles répondaient donc 404 sur le domaine
| central, celui où tourne le frontend. Elles n'ont pas besoin de la couche
| tenancy — l'isolation vient du scope `ecole_id` — et sont donc déclarées ici.
|
| Débit limité à 20 req/min par utilisateur (limiteur `ia`) pour borner le coût.
|
*/

Route::middleware(['auth:sanctum', 'throttle:ia'])->prefix('v1/ia')->group(function () {
    Route::post('/chat', [AIController::class, 'chat']);
    Route::post('/lesson-plan', [AIController::class, 'lessonPlan'])
        ->middleware('role:directeur,enseignant,censeur');
    Route::post('/tutor', [AIController::class, 'tutor'])
        ->middleware('role:eleve,enseignant,directeur');
    Route::post('/parent-assistant', [AIController::class, 'parentAssistant'])
        ->middleware('role:parent,directeur');
    Route::post('/analyze-results', [AIController::class, 'analyzeResults'])
        ->middleware('role:directeur,enseignant,censeur');
    Route::get('/predictive', [AIController::class, 'predictiveAnalysis'])
        ->middleware('role:directeur,censeur,super-admin');
});
