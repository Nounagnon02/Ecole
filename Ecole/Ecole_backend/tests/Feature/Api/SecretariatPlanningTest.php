<?php

use App\Models\Ecole;
use App\Models\Evenement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Planning du secrétariat (lot 6.4) : la page répondait 403 (audit), et la
 * création ignorait le type et la date de fin.
 */

beforeEach(function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]));
});

it('laisse le secrétariat créer, voir, modifier et supprimer un événement', function () {
    $id = $this->postJson('/api/secretaire/evenements', [
        'titre' => 'Conseil de classe 6ème', 'date_debut' => now()->addDays(3)->setTime(15, 0)->toDateTimeString(),
        'date_fin' => now()->addDays(3)->setTime(17, 0)->toDateTimeString(), 'type' => 'conseil', 'lieu' => 'Salle des professeurs',
    ])->assertCreated()->json('data.id');

    expect(Evenement::find($id)->type)->toBe('conseil')->and(Evenement::find($id)->date_fin)->not->toBeNull();

    $liste = $this->getJson('/api/secretaire/evenements')->assertOk()->json('data');
    expect(collect($liste)->pluck('titre')->all())->toBe(['Conseil de classe 6ème']);

    $this->putJson("/api/secretaire/evenements/{$id}", ['lieu' => 'Bibliothèque'])->assertOk();
    expect(Evenement::find($id)->lieu)->toBe('Bibliothèque');

    $this->deleteJson("/api/secretaire/evenements/{$id}")->assertOk();
    expect(Evenement::count())->toBe(0);
});

it('rend les événements passés récents et filtre par période', function () {
    foreach ([-10, 20, 400] as $jours) {
        Evenement::create(['titre' => "J{$jours}", 'date_debut' => now()->addDays($jours), 'type' => 'evenement', 'ecole_id' => auth()->user()->ecole_id]);
    }

    expect(collect($this->getJson('/api/secretaire/evenements')->json('data'))->pluck('titre')->all())->toBe(['J-10', 'J20'])
        ->and(collect($this->getJson('/api/secretaire/evenements?du='.now()->addDays(300)->toDateString().'&au='.now()->addDays(500)->toDateString())->json('data'))->pluck('titre')->all())->toBe(['J400']);
});

it('refuse une fin avant le début et un type inconnu', function () {
    $this->postJson('/api/secretaire/evenements', ['titre' => 'X', 'date_debut' => '2026-12-10 10:00', 'date_fin' => '2026-12-09 10:00'])->assertStatus(422);
    $this->postJson('/api/secretaire/evenements', ['titre' => 'X', 'date_debut' => '2026-12-10 10:00', 'type' => 'fete'])->assertStatus(422);
});

it('reste fermé à un enseignant', function () {
    $this->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => auth()->user()->ecole_id]));

    $this->getJson('/api/secretaire/evenements')->assertStatus(403);
});
