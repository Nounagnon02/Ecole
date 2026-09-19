<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Devoir;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * DevoirController (scolaire — à ne pas confondre avec
 * Universite\DevoirController) — aucun test ne couvrait ce contrôleur avant
 * celui-ci.
 *
 * `Eleve` n'a pas d'attribut `class_id` (la colonne est `classe_id`) :
 * `indexEleve()` et l'inscription automatique dans `store()` comparaient
 * contre cette clé inexistante, qui résout toujours `null`. Un élève ne
 * voyait donc jamais aucun devoir publié pour sa classe, et publier un
 * devoir n'y inscrivait jamais personne.
 */
class DevoirControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Classes $classe;
    private Matieres $matiere;
    private User $enseignantUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        $this->enseignantUser = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
    }

    private function eleve(): array
    {
        $eleveModel = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->classe->id]);
        return [$eleveModel->user, $eleveModel];
    }

    /** @test */
    public function a_student_sees_a_published_assignment_of_their_class()
    {
        [$user, ] = $this->eleve();

        $devoir = Devoir::create([
            'enseignant_id' => $this->enseignantUser->id,
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'titre' => 'Dissertation',
            'publie' => true,
            'ecole_id' => $this->school->id,
        ]);

        // Bruit : un devoir d'une autre classe ne doit jamais apparaître.
        $autreClasse = Classes::factory()->create(['ecole_id' => $this->school->id]);
        Devoir::create([
            'enseignant_id' => $this->enseignantUser->id, 'classe_id' => $autreClasse->id,
            'titre' => 'Autre classe', 'publie' => true, 'ecole_id' => $this->school->id,
        ]);

        $data = $this->actingAs($user)->getJson('/api/devoirs/eleve')->assertOk()->json('data');

        $this->assertCount(1, $data);
        $this->assertSame($devoir->id, $data[0]['id']);
    }

    /** @test */
    public function a_student_does_not_see_an_unpublished_draft()
    {
        [$user, ] = $this->eleve();

        Devoir::create([
            'enseignant_id' => $this->enseignantUser->id,
            'classe_id' => $this->classe->id,
            'titre' => 'Brouillon',
            'publie' => false,
            'ecole_id' => $this->school->id,
        ]);

        $data = $this->actingAs($user)->getJson('/api/devoirs/eleve')->assertOk()->json('data');
        $this->assertCount(0, $data);
    }

    /** @test */
    public function publishing_an_assignment_enrols_every_student_of_the_class()
    {
        [$user1, ] = $this->eleve();
        [$user2, ] = $this->eleve();

        $this->actingAs($this->enseignantUser)->postJson('/api/devoirs', [
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'titre' => 'Dissertation',
            'publie' => true,
        ])->assertStatus(201);

        $devoir = Devoir::where('titre', 'Dissertation')->firstOrFail();

        $this->assertTrue($devoir->eleves()->whereKey($user1->id)->exists());
        $this->assertTrue($devoir->eleves()->whereKey($user2->id)->exists());
        $this->assertSame(2, $devoir->eleves()->count());
    }

    /** @test */
    public function a_student_can_submit_their_assignment()
    {
        [$user, ] = $this->eleve();
        $devoir = Devoir::create([
            'enseignant_id' => $this->enseignantUser->id, 'classe_id' => $this->classe->id,
            'titre' => 'Dissertation', 'publie' => true, 'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($user)->postJson("/api/devoirs/{$devoir->id}/soumettre", [
            'reponse' => 'Ma réponse',
        ])->assertOk();

        $this->assertTrue($devoir->eleves()->whereKey($user->id)->wherePivot('rendu', true)->exists());
    }

    /** @test */
    public function a_different_teacher_cannot_grade_this_assignment()
    {
        [$user, ] = $this->eleve();
        $devoir = Devoir::create([
            'enseignant_id' => $this->enseignantUser->id, 'classe_id' => $this->classe->id,
            'titre' => 'Dissertation', 'publie' => true, 'ecole_id' => $this->school->id,
        ]);
        $devoir->eleves()->attach($user->id, ['rendu' => true, 'date_remise' => now()]);

        $otherTeacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);

        $this->actingAs($otherTeacher)->postJson("/api/devoirs/{$devoir->id}/noter/{$user->id}", [
            'note' => 18,
        ])->assertStatus(403);
    }

    /** @test */
    public function the_owning_teacher_can_grade_the_assignment()
    {
        [$user, ] = $this->eleve();
        $devoir = Devoir::create([
            'enseignant_id' => $this->enseignantUser->id, 'classe_id' => $this->classe->id,
            'titre' => 'Dissertation', 'publie' => true, 'ecole_id' => $this->school->id,
        ]);
        $devoir->eleves()->attach($user->id, ['rendu' => true, 'date_remise' => now()]);

        $this->actingAs($this->enseignantUser)->postJson("/api/devoirs/{$devoir->id}/noter/{$user->id}", [
            'note' => 18,
        ])->assertOk();

        $this->assertEquals(18, $devoir->eleves()->whereKey($user->id)->first()->pivot->note);
    }
}
