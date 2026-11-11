<?php

use App\Models\Ecole;
use App\Models\Universite\Departement;
use App\Models\Universite\Faculte;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Le tableau de bord de l'université répondait 500 en développement et en
 * recette : il lisait `$faculte->departements` sans l'avoir chargé, et
 * l'application interdit le chargement à la demande hors production. Les tests
 * ne le voyaient pas, cette garde étant inactive en environnement de test
 * (audit BUG-005).
 */

afterEach(fn () => Model::preventLazyLoading(false));

it('répond sans charger de relation à la demande', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $recteur = User::factory()->create(['role' => 'recteur', 'ecole_id' => $ecole->id]);
    // Deux facultés : la garde ne signale un chargement à la demande que sur
    // un modèle issu d'une collection de plusieurs éléments.
    foreach (Faculte::factory()->count(2)->forSchool($ecole)->create() as $faculte) {
        Departement::factory()->create(['faculte_id' => $faculte->id, 'ecole_id' => $ecole->id]);
    }

    Model::preventLazyLoading(true);

    $this->actingAs($recteur)->getJson('/api/dashboard/universite')
        ->assertOk()
        ->assertJsonPath('data.facultes.0.departements', 1);
});
