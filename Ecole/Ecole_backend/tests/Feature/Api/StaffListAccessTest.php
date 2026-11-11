<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Des pages du personnel partent de données que l'API leur refusait
 * (audit BUG-003, BUG-004, BUG-006) : la comptabilité ne pouvait ouvrir aucun
 * échéancier faute de liste d'élèves, le censeur n'avait aucune page
 * utilisable, le surveillant ne pouvait pas faire l'appel.
 */

function membre(string $role): User
{
    $ecole = Ecole::first() ?? Ecole::factory()->create(['status' => 'active']);

    return User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id, 'is_active' => true]);
}

it('ouvre la liste des élèves au personnel dont une page en dépend', function (string $role) {
    $this->actingAs(membre($role))->getJson('/api/eleves')->assertOk();
})->with(['secretaire', 'comptable', 'surveillant', 'censeur', 'enseignant']);

it('garde la liste des élèves fermée aux autres rôles', function (string $role) {
    $this->actingAs(membre($role))->getJson('/api/eleves')->assertForbidden();
})->with(['parent', 'eleve', 'infirmier', 'bibliothecaire']);

it('ouvre au censeur les incidents, les absences et les statistiques de vie scolaire', function (string $chemin) {
    $this->actingAs(membre('censeur'))->getJson($chemin)->assertOk();
})->with(['/api/surveillant/incidents', '/api/surveillant/absences', '/api/surveillant/statistiques']);

it('garde la vie scolaire fermée aux familles', function (string $role) {
    $this->actingAs(membre($role))->getJson('/api/surveillant/incidents')->assertForbidden();
})->with(['parent', 'eleve']);
