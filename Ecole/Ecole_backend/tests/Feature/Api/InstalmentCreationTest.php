<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Échéances dues (lot 6.8) : ce que la famille doit, pour un élève ou une classe.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->eleves = Eleve::factory()->count(3)->forSchool($this->ecole)->create(['classe_id' => $this->classe->id]);
    $this->actingAs(User::factory()->create(['role' => 'comptable', 'ecole_id' => $this->ecole->id]));
});

it('crée la même échéance pour chaque élève inscrit d’une classe, une seule fois', function () {
    $this->eleves[2]->update(['statut' => 'inactive']);
    $donnees = ['classe_id' => $this->classe->id, 'type_paiement' => 'Scolarité 1re tranche', 'montant_total' => 45000, 'date_paiement' => '2026-12-15'];

    $this->postJson('/api/comptable/echeances', $donnees)->assertCreated()->assertJsonPath('crees', 2);
    $this->postJson('/api/comptable/echeances', $donnees)->assertOk()->assertJsonPath('crees', 0)->assertJsonPath('deja_facturees', 2);

    expect(PaiementEleve::count())->toBe(2);
    $e = PaiementEleve::first();
    expect((float) $e->montant_restant)->toBe(45000.0)->and((float) $e->montant_paye)->toBe(0.0)->and($e->statut_global)->toBe(PaiementEleve::PENDING);
});

it('crée une échéance pour un seul élève, que le guichet peut encaisser', function () {
    $id = $this->postJson('/api/comptable/echeances', ['eleve_id' => $this->eleves[0]->id, 'type_paiement' => 'Frais d’inscription', 'montant_total' => 10000, 'date_paiement' => '2026-11-30'])
        ->assertCreated()->json('crees');
    expect($id)->toBe(1);

    $echeance = PaiementEleve::sole();
    $this->postJson("/api/comptable/echeancier/{$echeance->id}/encaisser", ['montant' => 10000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    expect($echeance->fresh()->statut_global)->toBe(PaiementEleve::PAID);
});

it('exige un élève ou une classe, et un montant positif', function () {
    $this->postJson('/api/comptable/echeances', ['type_paiement' => 'X', 'montant_total' => 100, 'date_paiement' => '2026-12-01'])->assertStatus(422);
    $this->postJson('/api/comptable/echeances', ['classe_id' => $this->classe->id, 'type_paiement' => 'X', 'montant_total' => 0, 'date_paiement' => '2026-12-01'])->assertStatus(422);
});
