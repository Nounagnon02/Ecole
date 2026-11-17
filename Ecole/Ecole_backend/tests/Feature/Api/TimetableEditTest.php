<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\EmploiDuTemps;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Emploi du temps (lot 6.3) : lecture complète d'une classe, ajout, conflit,
 * modification et suppression d'un cours.
 */

function ecoleEdt(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $matiere = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Mathématiques']);
    $prof = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id, 'name' => 'HOUNKPE', 'prenom' => 'Marie']);
    $enseignant = Enseignant::create(['user_id' => $prof->id, 'ecole_id' => $ecole->id]);
    test()->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]));

    return compact('ecole', 'classe', 'matiere', 'enseignant');
}

function cours(array $c, array $extra = [])
{
    return test()->postJson('/api/emploi-du-temps/store', $extra + [
        'classe_id' => $c['classe']->id, 'matiere_id' => $c['matiere']->id, 'enseignant_id' => $c['enseignant']->id,
        'jour' => 'Lundi', 'heure_debut' => '08:00', 'heure_fin' => '10:00', 'salle' => 'S101',
    ]);
}

it('rend tout l’emploi du temps d’une classe, au-delà de 50 cours, avec le nom de l’enseignant', function () {
    $c = ecoleEdt();
    foreach (range(0, 59) as $i) {
        EmploiDuTemps::create(['classe_id' => $c['classe']->id, 'matiere_id' => $c['matiere']->id, 'enseignant_id' => $c['enseignant']->id,
            'jour' => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][$i % 6], 'heure_debut' => sprintf('%02d:00', 6 + intdiv($i, 6)), 'heure_fin' => sprintf('%02d:50', 6 + intdiv($i, 6)), 'ecole_id' => $c['ecole']->id]);
    }

    $data = $this->getJson("/api/emploi-du-temps?classe_id={$c['classe']->id}")->assertOk()->json('data');

    expect($data)->toHaveCount(60)
        ->and($data[0]['enseignant']['user']['name'])->toBe('HOUNKPE');
});

it('accepte un cours sans salle', function () {
    $c = ecoleEdt();

    cours($c, ['salle' => null])->assertCreated();
});

it('ajoute, refuse un conflit, modifie et supprime un cours', function () {
    $c = ecoleEdt();

    $id = cours($c)->assertSuccessful()->json('data.id');
    cours($c, ['heure_debut' => '09:00', 'heure_fin' => '11:00'])->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'Conflit'));
    $this->putJson("/api/emploi-du-temps/update/{$id}", ['jour' => 'Mardi', 'salle' => 'S202'])->assertOk();
    expect(EmploiDuTemps::find($id)->only(['jour', 'salle']))->toBe(['jour' => 'Mardi', 'salle' => 'S202']);

    $this->deleteJson("/api/emploi-du-temps/delete/{$id}")->assertSuccessful();
    expect(EmploiDuTemps::count())->toBe(0);
});
