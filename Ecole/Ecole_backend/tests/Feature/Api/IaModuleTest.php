<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

/*
 * Assistant IA : hors plan, masqué (plan de correction). Les écrans ne
 * l'offrent plus ; l'API ne doit pas non plus répondre tant que le module
 * n'est pas activé (MODULE_IA=true).
 */

it('ne répond pas tant que le module est coupé', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]));

    expect(config('modules.ia'))->toBeFalse();
    $this->postJson('/api/v1/ia/chat', ['message' => 'Bonjour'])->assertNotFound();
    $this->getJson('/api/v1/ia/predictive')->assertNotFound();
});

it('ne déclare aucune route IA par défaut', function () {
    $ia = collect(Route::getRoutes())->filter(fn ($r) => str_starts_with($r->uri(), 'api/v1/ia'));

    expect($ia)->toBeEmpty();
});
