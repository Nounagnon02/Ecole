<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use App\Support\AnneeScolaire;
use App\Support\Inscription;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * La liste des notes (`GET /notes/eleve`) n'était bornée qu'à l'école : un
 * parent ou un élève qui l'appelait sans identifiant recevait les notes de
 * tous les élèves de l'établissement.
 */

function ecoleNotee(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $matiere = Matieres::factory()->create(['ecole_id' => $ecole->id]);
    $eleves = collect([12, 15, 9])->map(function ($note) use ($ecole, $classe, $matiere) {
        $eleve = Eleve::factory()->forSchool($ecole)->create(['classe_id' => $classe->id]);
        Notes::create(['eleve_id' => $eleve->id, 'classe_id' => $classe->id, 'matiere_id' => $matiere->id, 'note' => $note, 'note_sur' => 20,
            'type_evaluation' => 'Devoir1', 'date_evaluation' => '2026-11-10', 'periode' => 'Trimestre 1', 'annee_scolaire' => AnneeScolaire::courante(),
            'ecole_id' => $ecole->id]);

        return $eleve;
    });

    return [$ecole, $eleves];
}

$eleveIds = fn ($reponse) => collect($reponse->json('data.data'))->pluck('eleve_id')->unique()->sort()->values()->all();

it('ne donne au parent que les notes de ses enfants', function () use ($eleveIds) {
    [$ecole, $eleves] = ecoleNotee();
    Inscription::rattacherParent($eleves[0], ['name' => 'P', 'telephone' => '0197000001'], $ecole->id);
    Inscription::rattacherParent($eleves[1], ['name' => 'P', 'telephone' => '0197000001'], $ecole->id);
    $parent = User::where('identifiant', '0197000001')->sole();
    $parent->forceFill(['password_change_required' => false])->save();

    $reponse = $this->actingAs($parent)->getJson('/api/notes/eleve')->assertOk();

    expect($eleveIds($reponse))->toBe(collect([$eleves[0]->id, $eleves[1]->id])->sort()->values()->all());
});

it('ne donne à l’élève que ses propres notes', function () use ($eleveIds) {
    [, $eleves] = ecoleNotee();

    $reponse = $this->actingAs($eleves[2]->user)->getJson('/api/notes/eleve')->assertOk();

    expect($eleveIds($reponse))->toBe([$eleves[2]->id]);
});

it('laisse la direction voir toutes les notes de l’école', function () use ($eleveIds) {
    [$ecole, $eleves] = ecoleNotee();

    $reponse = $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]))->getJson('/api/notes/eleve')->assertOk();

    expect($eleveIds($reponse))->toHaveCount(3);
});
