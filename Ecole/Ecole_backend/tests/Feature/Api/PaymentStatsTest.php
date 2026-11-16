<?php

use App\Models\Ecole;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * `/api/payments/stats` groupait les recettes par `MONTH(paid_at)`, propre à
 * MySQL : sur SQLite (CI), la requête échoue (R-47, 16/11/2026). Le test
 * fixe la forme attendue — `month` numérique, `total` de la seule école du
 * demandeur — quel que soit le pilote.
 */
it('donne les recettes du mois en cours, pour la seule école du directeur', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $autre = Ecole::factory()->create(['status' => 'active']);
    $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id, 'is_active' => true]);

    Payment::factory()->complete()->create(['ecole_id' => $ecole->id, 'amount' => 10000]);
    Payment::factory()->complete()->create(['ecole_id' => $ecole->id, 'amount' => 5000]);
    Payment::factory()->complete()->create(['ecole_id' => $autre->id, 'amount' => 70000]);
    Payment::factory()->create(['ecole_id' => $ecole->id, 'amount' => 999, 'status' => 'pending']);

    $reponse = $this->actingAs($directeur)->getJson('/api/payments/stats')->assertOk();

    $mois = collect($reponse->json('data.monthly_revenue'))
        ->map(fn ($ligne) => ['month' => (int) $ligne['month'], 'total' => (float) $ligne['total']])
        ->all();

    expect($mois)->toBe([['month' => (int) now()->month, 'total' => 15000.0]])
        ->and((float) $reponse->json('data.total_collected'))->toBe(15000.0)
        ->and((float) $reponse->json('data.pending_amount'))->toBe(999.0);
});
