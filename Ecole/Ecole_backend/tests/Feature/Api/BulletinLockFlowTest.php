<?php

use App\Models\Bulletin;
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
 * Arrêter les bulletins d'une classe (lot 5.4) : calcul, archive et
 * verrouillage des notes en une seule action de la direction.
 */

function classeAvecNotes(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $maths = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Mathématiques']);
    test()->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]));

    $eleves = collect([14, 9, null, 16])->map(function ($note) use ($ecole, $classe, $maths) {
        $eleve = Eleve::factory()->forSchool($ecole)->create(['classe_id' => $classe->id]);
        if ($note !== null) {
            Notes::create(['eleve_id' => $eleve->id, 'classe_id' => $classe->id, 'matiere_id' => $maths->id, 'note' => $note, 'note_sur' => 20,
                'type_evaluation' => 'Devoir1', 'date_evaluation' => '2026-11-10', 'periode' => 'Trimestre 1', 'annee_scolaire' => AnneeScolaire::courante()]);
        }

        return $eleve;
    });

    return compact('ecole', 'classe', 'maths', 'eleves');
}

function arreter(Classes $classe, string $periode = 'Trimestre 1')
{
    return test()->postJson('/api/bulletins/verrouiller', ['classe_id' => $classe->id, 'periode' => $periode]);
}

it('calcule et fige les bulletins en une action, sans calcul préalable', function () {
    $c = classeAvecNotes();

    $reponse = arreter($c['classe'])->assertOk();

    // L'élève sans note n'a pas de bulletin et ne fausse pas le rang.
    expect(Bulletin::count())->toBe(3)
        ->and($reponse->json('notes_verrouillees'))->toBe(3)
        ->and(collect($reponse->json('data'))->sortBy('rang')->pluck('moyenne_generale')->map(fn ($m) => (float) $m)->values()->all())->toBe([16.0, 14.0, 9.0])
        ->and(collect($reponse->json('data'))->firstWhere('rang', 1)['total_eleves'])->toBe(3)
        ->and(collect($reponse->json('data'))->firstWhere('rang', 1)['eleve']['user']['name'])->not->toBeEmpty();
});

it('verrouille les notes qui ont servi au bulletin', function () {
    $c = classeAvecNotes();
    arreter($c['classe'])->assertOk();

    expect(Notes::where('locked', false)->count())->toBe(0);
});

it('exclut un élève retiré des effectifs', function () {
    $c = classeAvecNotes();
    $c['eleves'][3]->update(['statut' => 'inactive']);

    arreter($c['classe'])->assertOk();

    expect(Bulletin::count())->toBe(2)->and(Bulletin::where('eleve_id', $c['eleves'][3]->id)->exists())->toBeFalse();
});

it('dit pourquoi rien n’est arrêté quand la période n’a pas de note', function () {
    $c = classeAvecNotes();

    arreter($c['classe'], 'Trimestre 2')->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'Aucune note'));
    expect(Bulletin::count())->toBe(0);
});

it('réserve l’arrêt des bulletins à la direction et au censeur', function () {
    $c = classeAvecNotes();

    test()->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => $c['ecole']->id]));
    arreter($c['classe'])->assertStatus(403);

    test()->actingAs(User::factory()->create(['role' => 'censeur', 'ecole_id' => $c['ecole']->id]));
    arreter($c['classe'])->assertOk();
});

it('montre au parent le bulletin de son enfant et à lui seul', function () {
    $c = classeAvecNotes();
    arreter($c['classe'])->assertOk();
    Inscription::rattacherParent($c['eleves'][0], ['name' => 'P', 'telephone' => '0197000001'], $c['ecole']->id);
    $parent = User::where('identifiant', '0197000001')->sole();
    $parent->forceFill(['password_change_required' => false])->save();

    $bulletins = test()->actingAs($parent)->getJson('/api/bulletins')->assertOk()->json('data');

    expect($bulletins)->toHaveCount(1)
        ->and($bulletins[0]['eleve_id'])->toBe($c['eleves'][0]->id)
        ->and((float) $bulletins[0]['moyenne_generale'])->toBe(14.0);
});
