<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Matieres;
use App\Models\Series;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Programme d'une classe (audit du 14/11, N-08) : séries, matières et
 * coefficients d'une classe, configurés par la direction sans passer par
 * la base. L'API d'écriture existait sans écran ; il manquait la lecture
 * du programme d'une classe, et retirer une matière la retirait de toutes
 * les classes de la série.
 */
function ecoleProgramme(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    test()->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]));
    $sixieme = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $cinquieme = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '5ème']);
    $serie = Series::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Collège']);
    $maths = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Mathématiques']);
    $svt = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'SVT']);

    return compact('ecole', 'sixieme', 'cinquieme', 'serie', 'maths', 'svt');
}

function lignesProgramme(Classes $classe): array
{
    return DB::table('serie_matieres')->where('classe_id', $classe->id)->orderBy('matiere_id')
        ->get(['serie_id', 'matiere_id', 'coefficient'])->map(fn ($l) => [(int) $l->serie_id, (int) $l->matiere_id, (float) $l->coefficient])->all();
}

it('configure une classe neuve : série, matières et coefficients, puis la relit', function () {
    ['sixieme' => $c, 'serie' => $s, 'maths' => $m, 'svt' => $v] = ecoleProgramme();

    $this->postJson("/api/series/{$s->id}/matieres", ['matiere_id' => $m->id, 'classe_id' => $c->id, 'coefficient' => 4])->assertCreated();
    $this->postJson("/api/series/{$s->id}/matieres", ['matiere_id' => $v->id, 'classe_id' => $c->id, 'coefficient' => 2])->assertCreated();

    $this->getJson("/api/classes/{$c->id}/programme")->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.serie_nom', 'Collège')
        ->assertJsonPath('data.0.matiere_nom', 'Mathématiques')
        ->assertJsonPath('data.0.coefficient', 4)
        ->assertJsonPath('data.1.matiere_nom', 'SVT');

    // La classe configurée est affectable : ses matières sont lues par l'affectation.
    $this->getJson("/api/series/classe/{$c->id}/serie/{$s->id}/matieres")->assertOk()->assertJsonCount(2);
});

it('ne retire une matière que de la classe visée', function () {
    ['sixieme' => $a, 'cinquieme' => $b, 'serie' => $s, 'maths' => $m] = ecoleProgramme();
    foreach ([$a, $b] as $c) {
        $s->matieres()->attach($m->id, ['classe_id' => $c->id, 'coefficient' => 3]);
    }

    $this->deleteJson("/api/series/{$s->id}/matieres/{$m->id}?classe_id={$a->id}")->assertOk();

    expect(lignesProgramme($a))->toBe([])
        ->and(lignesProgramme($b))->toBe([[$s->id, $m->id, 3.0]]);
});

it('ne change le coefficient que de la classe visée', function () {
    ['sixieme' => $a, 'cinquieme' => $b, 'serie' => $s, 'maths' => $m] = ecoleProgramme();
    foreach ([$a, $b] as $c) {
        $s->matieres()->attach($m->id, ['classe_id' => $c->id, 'coefficient' => 3]);
    }

    $this->putJson("/api/series/{$s->id}/matieres/{$m->id}/coefficient", ['classe_id' => $a->id, 'coefficient' => 5])->assertOk();

    expect(lignesProgramme($a))->toBe([[$s->id, $m->id, 5.0]])
        ->and(lignesProgramme($b))->toBe([[$s->id, $m->id, 3.0]]);
});

it('ne montre pas le programme d’une classe d’une autre école', function () {
    ['sixieme' => $c] = ecoleProgramme();
    ecoleProgramme(); // autre école, autre directeur connecté

    $this->getJson("/api/classes/{$c->id}/programme")->assertNotFound();
});

it('réserve la lecture du programme à la direction', function () {
    ['ecole' => $e, 'sixieme' => $c] = ecoleProgramme();
    $this->actingAs(User::factory()->create(['role' => 'parent', 'ecole_id' => $e->id]));

    $this->getJson("/api/classes/{$c->id}/programme")->assertForbidden();
});
