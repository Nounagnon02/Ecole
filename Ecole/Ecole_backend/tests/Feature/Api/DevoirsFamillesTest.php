<?php

use App\Models\Classes;
use App\Models\Devoir;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Support\Facades\DB;

/*
 * Parcours 4 de la mission (R-30, 16/11/2026) : l'enseignant donne un devoir
 * à SA classe ; le parent d'un élève de la classe le lit ; les autres
 * familles et classes sont refusées, même en forgeant la requête.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->autreClasse = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->prof = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->ecole->id]);
    $fiche = Enseignant::create(['user_id' => $this->prof->id, 'ecole_id' => $this->ecole->id]);
    $matiere = DB::table('matieres')->insertGetId(['ecole_id' => $this->ecole->id, 'nom' => 'Maths', 'created_at' => now(), 'updated_at' => now()]);
    $serie = DB::table('series')->insertGetId(['ecole_id' => $this->ecole->id, 'nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('enseignant_matiere')->insert(['ecole_id' => $this->ecole->id, 'enseignant_id' => $fiche->id, 'matiere_id' => $matiere, 'classe_id' => $this->classe->id, 'serie_id' => $serie]);
    $this->matiere = $matiere;

    $famille = function (Classes $classe) {
        $parent = User::factory()->create(['role' => 'parent', 'ecole_id' => $this->ecole->id]);
        $fiche = UserParent::factory()->create(['ecole_id' => $this->ecole->id, 'user_id' => $parent->id]);
        $enfant = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $classe->id]);
        $fiche->eleves()->attach($enfant->id);

        return [$parent, $enfant];
    };
    [$this->parent, $this->enfant] = $famille($this->classe);
    [$this->autreParent, $this->autreEnfant] = $famille($this->autreClasse);
});

function donnerDevoir($test, int $classeId)
{
    return $test->actingAs($test->prof)->postJson('/api/devoirs', [
        'classe_id' => $classeId, 'matiere_id' => $test->matiere, 'titre' => 'Exercices 3 et 4 p. 52', 'date_limite' => now()->addDays(3)->toDateString(),
    ]);
}

it('laisse l’enseignant donner un devoir à sa classe, lu par le parent d’un élève de la classe', function () {
    donnerDevoir($this, $this->classe->id)->assertCreated();

    $this->actingAs($this->parent)->getJson("/api/parent/enfants/{$this->enfant->id}/devoirs")
        ->assertOk()->assertJsonPath('data.0.titre', 'Exercices 3 et 4 p. 52')->assertJsonPath('data.0.matiere.nom', 'Maths');
});

it('refuse à l’enseignant de donner un devoir à une classe qui n’est pas la sienne', function () {
    donnerDevoir($this, $this->autreClasse->id)->assertStatus(403);
    expect(Devoir::count())->toBe(0);
});

it('ne montre pas le devoir d’une classe à la famille d’une autre classe', function () {
    donnerDevoir($this, $this->classe->id)->assertCreated();

    $this->actingAs($this->autreParent)->getJson("/api/parent/enfants/{$this->autreEnfant->id}/devoirs")->assertOk()->assertJsonCount(0, 'data');
    $this->actingAs($this->autreParent)->getJson("/api/parent/enfants/{$this->enfant->id}/devoirs")->assertStatus(404);
});

it('refuse le détail d’un devoir à une famille d’une autre classe', function () {
    $id = donnerDevoir($this, $this->classe->id)->json('data.id');

    $this->actingAs($this->parent)->getJson("/api/devoirs/{$id}")->assertOk();
    $this->actingAs($this->autreParent)->getJson("/api/devoirs/{$id}")->assertStatus(403);
});
