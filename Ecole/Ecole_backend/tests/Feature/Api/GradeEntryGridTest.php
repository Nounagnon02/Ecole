<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Grille de saisie des notes (lot 5.1).
 *
 * La saisie groupée ne faisait que créer : corriger une note d'un devoir déjà
 * saisi renvoyait toute la classe en erreur. Et rien ne tenait l'enseignant à
 * ses affectations : il pouvait noter n'importe quelle classe de l'école.
 */

function classeNotee(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $maths = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Mathématiques']);
    $svt = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'SVT']);
    $serieId = DB::table('series')->insertGetId(['ecole_id' => $ecole->id, 'nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()]);
    foreach ([$maths, $svt] as $matiere) {
        DB::table('serie_matieres')->insert(['ecole_id' => $ecole->id, 'serie_id' => $serieId, 'matiere_id' => $matiere->id, 'classe_id' => $classe->id, 'coefficient' => 2]);
    }
    $eleves = collect(['B2', 'B1', 'B3'])->map(fn ($m) => Eleve::factory()->forSchool($ecole)->create(['classe_id' => $classe->id, 'numero_matricule' => $m]));

    $prof = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]);
    $enseignant = Enseignant::create(['user_id' => $prof->id, 'ecole_id' => $ecole->id]);
    DB::table('enseignant_matiere')->insert(['ecole_id' => $ecole->id, 'enseignant_id' => $enseignant->id, 'matiere_id' => $maths->id, 'classe_id' => $classe->id, 'serie_id' => $serieId]);

    test()->actingAs($prof);

    return compact('ecole', 'classe', 'maths', 'svt', 'eleves', 'prof');
}

function saisir(array $c, array $notes, array $extra = [])
{
    return test()->postJson('/api/notes/bulk', $extra + [
        'classe_id' => $c['classe']->id, 'matiere_id' => $c['maths']->id, 'type_evaluation' => 'Devoir1',
        'date_evaluation' => '2026-11-10', 'periode' => 'Trimestre 1',
        'notes' => collect($notes)->map(fn ($note, $i) => ['eleve_id' => $c['eleves'][$i]->id, 'note' => $note])->values()->all(),
    ]);
}

it('enregistre la grille, puis la corrige sans doublon quand on la réenregistre', function () {
    $c = classeNotee();

    saisir($c, [12, 8.5, 15])->assertCreated()->assertJsonPath('count', 3);
    saisir($c, [12, 9.5, 15], ['date_evaluation' => '2026-11-12'])->assertCreated()->assertJsonPath('count', 3);

    expect(Notes::count())->toBe(3)
        ->and((float) Notes::where('eleve_id', $c['eleves'][1]->id)->sole()->note)->toBe(9.5);
});

it('ne modifie pas une note verrouillée et le signale', function () {
    $c = classeNotee();
    saisir($c, [12, 8.5])->assertCreated();
    Notes::where('eleve_id', $c['eleves'][0]->id)->update(['locked' => true]);

    $reponse = saisir($c, [20, 10])->assertCreated();

    expect($reponse->json('warnings.0'))->toContain('verrouillée')
        ->and((float) Notes::where('eleve_id', $c['eleves'][0]->id)->sole()->note)->toBe(12.0)
        ->and((float) Notes::where('eleve_id', $c['eleves'][1]->id)->sole()->note)->toBe(10.0);
});

it('garde plusieurs interrogations distinctes par leur date', function () {
    $c = classeNotee();

    saisir($c, [10], ['type_evaluation' => 'Interrogation', 'date_evaluation' => '2026-11-03'])->assertCreated();
    saisir($c, [14], ['type_evaluation' => 'Interrogation', 'date_evaluation' => '2026-11-10'])->assertCreated();
    saisir($c, [11], ['type_evaluation' => 'Interrogation', 'date_evaluation' => '2026-11-03'])->assertCreated();

    expect(Notes::orderBy('date_evaluation')->pluck('note')->map(fn ($n) => (float) $n)->all())->toBe([11.0, 14.0]);
});

it('ouvre la grille sur les élèves, les matières de l’enseignant et les notes déjà saisies', function () {
    $c = classeNotee();
    saisir($c, [12, 8.5])->assertCreated();
    $c['eleves'][2]->update(['statut' => 'inactive']);

    $grille = $this->getJson("/api/notes/grille/{$c['classe']->id}?matiere_id={$c['maths']->id}&type_evaluation=Devoir1&periode=Trimestre 1")
        ->assertOk()->json('data');

    // Rangés par matricule ; l'élève retiré des effectifs n'y figure plus.
    expect(collect($grille['eleves'])->pluck('matricule')->all())->toBe(['B1', 'B2'])
        ->and(collect($grille['matieres'])->pluck('nom')->all())->toBe(['Mathématiques'])
        ->and(collect($grille['notes'])->pluck('note', 'eleve_id')->all())->toEqual([$c['eleves'][0]->id => 12, $c['eleves'][1]->id => 8.5]);
});

it('tient l’enseignant à ses affectations, pas la direction', function () {
    $c = classeNotee();
    $autreClasse = Classes::factory()->create(['ecole_id' => $c['ecole']->id, 'nom_classe' => '5ème']);

    // Matière non affectée dans sa classe ; classe non affectée.
    saisir($c, [12], ['matiere_id' => $c['svt']->id])->assertStatus(403);
    $this->getJson("/api/notes/grille/{$autreClasse->id}")->assertStatus(403);
    expect(Notes::count())->toBe(0);

    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $c['ecole']->id]));
    saisir($c, [12], ['matiere_id' => $c['svt']->id])->assertCreated();
    expect(collect($this->getJson("/api/notes/grille/{$c['classe']->id}")->assertOk()->json('data.matieres'))->pluck('nom')->sort()->values()->all())
        ->toBe(['Mathématiques', 'SVT']);
});

it('refuse une note hors de 0 à 20', function () {
    $c = classeNotee();

    saisir($c, [21])->assertStatus(422);
    saisir($c, [-1])->assertStatus(422);
    expect(Notes::count())->toBe(0);
});

it('donne à l’enseignant la liste de ses classes, une fois chacune', function () {
    $c = classeNotee();
    // Une seconde matière dans la même classe ne doit pas la faire apparaître deux fois.
    DB::table('enseignant_matiere')->insert(['ecole_id' => $c['ecole']->id, 'enseignant_id' => $c['prof']->enseignant->id,
        'matiere_id' => $c['svt']->id, 'classe_id' => $c['classe']->id, 'serie_id' => DB::table('series')->value('id')]);

    $classes = $this->getJson('/api/enseignant/classes')->assertOk()->json('data');

    expect($classes)->toHaveCount(1)
        ->and($classes[0]['nom_classe'])->toBe('6ème')
        ->and($classes[0]['eleves'])->toHaveCount(3);
});
