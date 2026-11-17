<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Emprunt;
use App\Models\Livre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Bibliothèque (lot 6.7) : exemplaires, prêt, retour.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->eleves = Eleve::factory()->count(3)->forSchool($this->ecole)->create();
    $this->actingAs(User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => $this->ecole->id]));
});

function livre(array $extra = [])
{
    return test()->postJson('/api/bibliothecaire/livres', $extra + [
        'titre' => 'L’Enfant noir', 'auteur' => 'Camara Laye', 'isbn' => '9782266000000', 'categorie' => 'Roman', 'annee_publication' => 1953, 'nombre_exemplaires' => 2,
    ]);
}

function preter(int $livreId, Eleve $eleve)
{
    return test()->postJson('/api/bibliothecaire/emprunts', ['livre_id' => $livreId, 'eleve_id' => $eleve->id, 'date_emprunt' => now()->toDateString(), 'date_retour_prevue' => now()->addWeeks(2)->toDateString()]);
}

it('prête chaque exemplaire puis refuse quand il n’en reste plus', function () {
    $id = livre()->assertSuccessful()->json('id');

    preter($id, $this->eleves[0])->assertCreated();
    expect(collect($this->getJson('/api/bibliothecaire/livres')->json())->firstWhere('id', $id))->toMatchArray(['exemplaires_disponibles' => 1, 'disponible' => true]);

    preter($id, $this->eleves[1])->assertCreated();
    preter($id, $this->eleves[2])->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'Aucun exemplaire'));

    expect(Emprunt::count())->toBe(2)->and(Livre::find($id)->disponible)->toBeFalse();
});

it('rend un exemplaire au retour, une seule fois', function () {
    $id = livre(['nombre_exemplaires' => 1])->json('id');
    $emprunt = preter($id, $this->eleves[0])->json('id');

    $this->putJson("/api/bibliothecaire/emprunts/{$emprunt}/retour")->assertOk();
    $this->putJson("/api/bibliothecaire/emprunts/{$emprunt}/retour")->assertStatus(422);

    expect(Livre::find($id)->disponible)->toBeTrue();
    preter($id, $this->eleves[1])->assertCreated();
});

it('n’interdit pas à une école l’ISBN d’une autre, mais refuse un doublon dans la même', function () {
    livre()->assertSuccessful();
    livre()->assertStatus(422)->assertJsonValidationErrors('isbn');

    $this->actingAs(User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => Ecole::factory()->create(['status' => 'active'])->id]));
    livre()->assertSuccessful();
});

it('refuse un retour prévu avant l’emprunt', function () {
    $id = livre()->json('id');

    $this->postJson('/api/bibliothecaire/emprunts', ['livre_id' => $id, 'eleve_id' => $this->eleves[0]->id, 'date_emprunt' => now()->toDateString(), 'date_retour_prevue' => now()->subDay()->toDateString()])
        ->assertStatus(422);
});
