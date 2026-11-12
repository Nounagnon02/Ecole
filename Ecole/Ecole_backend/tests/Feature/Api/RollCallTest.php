<?php

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Incident;
use App\Models\Sanction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Appel d'une classe (lot 6.1), justification, incidents et sanctions (6.2).
 */

function classeAppel(string $role = 'surveillant'): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $eleves = collect(['B2', 'B1', 'B3'])->map(fn ($m) => Eleve::factory()->forSchool($ecole)->create(['classe_id' => $classe->id, 'numero_matricule' => $m]));
    test()->actingAs(User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id]));

    return compact('ecole', 'classe', 'eleves');
}

function appel(array $c, array $statuts, string $date = '2026-11-10')
{
    return test()->postJson('/api/surveillant/appel', [
        'classe_id' => $c['classe']->id, 'date' => $date,
        'eleves' => collect($statuts)->map(fn ($statut, $i) => ['eleve_id' => $c['eleves'][$i]->id, 'statut' => $statut])->values()->all(),
    ]);
}

it('enregistre absents et retards, pas les présents', function () {
    $c = classeAppel();

    appel($c, ['present', 'absent', 'retard'])->assertOk()->assertJsonPath('data', ['present' => 1, 'absent' => 1, 'retard' => 1]);

    expect(Absence::count())->toBe(2)
        ->and(Absence::where('eleve_id', $c['eleves'][1]->id)->sole()->type)->toBe('absence')
        ->and(Absence::where('eleve_id', $c['eleves'][2]->id)->sole()->type)->toBe('retard');
});

it('se rejoue sans doublon et corrige un élève repassé présent', function () {
    $c = classeAppel();

    appel($c, ['absent', 'absent', 'present'])->assertOk();
    appel($c, ['absent', 'absent', 'present'])->assertOk();
    expect(Absence::count())->toBe(2);

    appel($c, ['present', 'retard', 'present'])->assertOk();
    expect(Absence::count())->toBe(1)
        ->and(Absence::sole()->eleve_id)->toBe($c['eleves'][1]->id)
        ->and(Absence::sole()->type)->toBe('retard');
});

it('rend la feuille du jour avec le statut déjà relevé, rangée par matricule', function () {
    $c = classeAppel();
    appel($c, ['absent', 'present', 'present'])->assertOk();
    $c['eleves'][2]->update(['statut' => 'inactive']);

    $feuille = $this->getJson("/api/surveillant/appel/{$c['classe']->id}?date=2026-11-10")->assertOk()->json('data.eleves');

    expect(collect($feuille)->pluck('statut', 'matricule')->all())->toBe(['B1' => 'present', 'B2' => 'absent']);
});

it('refuse un élève d’une autre classe et une date future', function () {
    $c = classeAppel();
    $autre = Eleve::factory()->forSchool($c['ecole'])->create();

    $this->postJson('/api/surveillant/appel', ['classe_id' => $c['classe']->id, 'date' => '2026-11-10', 'eleves' => [['eleve_id' => $autre->id, 'statut' => 'absent']]])
        ->assertStatus(422);
    appel($c, ['absent'], now()->addDay()->toDateString())->assertStatus(422);
    expect(Absence::count())->toBe(0);
});

it('justifie une absence', function () {
    $c = classeAppel();
    appel($c, ['absent'])->assertOk();

    $this->patchJson('/api/surveillant/absences/'.Absence::sole()->id, ['justifiee' => true, 'motif' => 'Certificat médical'])->assertOk();

    expect(Absence::sole()->justifiee)->toBeTrue()->and(Absence::sole()->motif)->toBe('Certificat médical');
});

it('fait avancer un incident et lève une sanction', function () {
    $c = classeAppel('censeur');
    $incident = $this->postJson('/api/surveillant/incidents', ['description' => 'Bagarre dans la cour', 'date' => '2026-11-10', 'gravite' => 'moyenne'])->assertSuccessful()->json('id');
    $sanction = $this->postJson('/api/surveillant/sanctions', ['eleve_id' => $c['eleves'][0]->id, 'type_sanction' => 'Avertissement', 'motif' => 'Bagarre', 'date' => '2026-11-10'])
        ->assertCreated()->json('id');

    $this->patchJson("/api/surveillant/incidents/{$incident}", ['statut' => 'resolu'])->assertOk();
    $this->patchJson("/api/surveillant/sanctions/{$sanction}", ['statut' => 'levee'])->assertOk();
    $this->patchJson("/api/surveillant/sanctions/{$sanction}", ['statut' => 'oubliee'])->assertStatus(422);

    expect(Incident::sole()->statut)->toBe('resolu')->and(Sanction::sole()->statut)->toBe('levee');
});

it('ferme l’appel aux enseignants et aux parents', function () {
    $c = classeAppel('enseignant');

    appel($c, ['absent'])->assertStatus(403);
});
