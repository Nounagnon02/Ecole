<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\Series;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * SeriesMatieresController — aucun test ne couvrait ce contrôleur avant
 * celui-ci (composition matières/coefficients d'une série, affectations
 * enseignants par classe × série).
 */
class SeriesMatieresControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $directeur;
    private Classes $classe;
    private Series $serie;
    private Matieres $matiere;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
        $this->classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->serie = Series::factory()->create(['ecole_id' => $this->school->id]);
        $this->matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        $this->actingAs($this->directeur);
    }

    /** @test */
    public function a_director_can_attach_a_subject_with_a_coefficient()
    {
        $this->postJson("/api/series/{$this->serie->id}/matieres", [
            'matiere_id' => $this->matiere->id,
            'classe_id' => $this->classe->id,
            'coefficient' => 3,
        ])->assertStatus(201);

        $this->assertDatabaseHas('serie_matieres', [
            'serie_id' => $this->serie->id,
            'matiere_id' => $this->matiere->id,
            'classe_id' => $this->classe->id,
            'coefficient' => 3,
        ]);
    }

    /** @test */
    public function attaching_the_same_subject_twice_for_the_same_class_is_refused()
    {
        $this->serie->matieres()->attach($this->matiere->id, ['classe_id' => $this->classe->id, 'coefficient' => 2]);

        $this->postJson("/api/series/{$this->serie->id}/matieres", [
            'matiere_id' => $this->matiere->id,
            'classe_id' => $this->classe->id,
            'coefficient' => 3,
        ])->assertStatus(409);
    }

    /** @test */
    public function a_teacher_cannot_attach_a_subject()
    {
        $teacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $this->actingAs($teacher);

        $this->postJson("/api/series/{$this->serie->id}/matieres", [
            'matiere_id' => $this->matiere->id,
            'classe_id' => $this->classe->id,
            'coefficient' => 3,
        ])->assertForbidden();
    }

    /** @test */
    public function attaching_a_subject_from_another_school_is_rejected()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignMatiere = $this->asDirectorOf($otherSchool, fn () => Matieres::factory()->create(['ecole_id' => $otherSchool->id]));

        $this->postJson("/api/series/{$this->serie->id}/matieres", [
            'matiere_id' => $foreignMatiere->id,
            'classe_id' => $this->classe->id,
            'coefficient' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors(['matiere_id']);
    }

    /** @test */
    public function a_director_can_sync_the_full_set_of_subjects()
    {
        $matiere2 = Matieres::factory()->create(['ecole_id' => $this->school->id]);

        $this->postJson("/api/series/{$this->serie->id}/matieres/sync", [
            'matieres' => [
                ['matiere_id' => $this->matiere->id, 'classe_id' => $this->classe->id, 'coefficient' => 2],
                ['matiere_id' => $matiere2->id, 'classe_id' => $this->classe->id, 'coefficient' => 4],
            ],
        ])->assertOk()->assertJsonPath('success', true);

        $this->assertCount(2, $this->serie->matieres()->get());
    }

    /** @test */
    public function a_director_can_update_a_coefficient()
    {
        $this->serie->matieres()->attach($this->matiere->id, ['classe_id' => $this->classe->id, 'coefficient' => 1]);

        $this->putJson("/api/series/{$this->serie->id}/matieres/{$this->matiere->id}/coefficient", [
            'classe_id' => $this->classe->id,
            'coefficient' => 5,
        ])->assertOk();

        $this->assertDatabaseHas('serie_matieres', [
            'serie_id' => $this->serie->id,
            'matiere_id' => $this->matiere->id,
            'coefficient' => 5,
        ]);
    }

    /** @test */
    public function a_director_can_detach_a_subject()
    {
        $this->serie->matieres()->attach($this->matiere->id, ['classe_id' => $this->classe->id, 'coefficient' => 1]);

        $this->deleteJson("/api/series/{$this->serie->id}/matieres/{$this->matiere->id}")->assertOk();

        $this->assertDatabaseMissing('serie_matieres', [
            'serie_id' => $this->serie->id,
            'matiere_id' => $this->matiere->id,
        ]);
    }

    /** @test */
    public function detaching_an_unattached_subject_returns_404()
    {
        $this->deleteJson("/api/series/{$this->serie->id}/matieres/{$this->matiere->id}")->assertStatus(404);
    }

    /** @test */
    public function a_director_can_assign_teachers_to_a_subject_in_a_class_and_series()
    {
        $this->serie->matieres()->attach($this->matiere->id, ['classe_id' => $this->classe->id, 'coefficient' => 1]);
        $enseignant = Enseignant::factory()->create(['ecole_id' => $this->school->id]);

        $this->postJson("/api/series/classe/{$this->classe->id}/serie/{$this->serie->id}/enseignants", [
            'matieres' => [[
                'classe_id' => $this->classe->id,
                'serie_id' => $this->serie->id,
                'matiere_id' => $this->matiere->id,
                'enseignants' => [$enseignant->id],
            ]],
        ])->assertOk()->assertJsonPath('success', true);

        $this->assertTrue($this->matiere->enseignants()->where('enseignants.id', $enseignant->id)->exists());
    }

    /** @test */
    public function subjects_and_coefficients_can_be_listed_for_a_class()
    {
        // `wherePivot()` appelé depuis un `when()` recevait le mauvais objet
        // et le filtre `classe_id` ne renvoyait jamais rien, quelle que soit
        // la classe demandée — une autre classe sert de témoin.
        $autreClasse = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->serie->matieres()->attach($this->matiere->id, ['classe_id' => $this->classe->id, 'coefficient' => 2]);

        $response = $this->getJson("/api/series/{$this->serie->id}/matieres/coefficients?classe_id={$this->classe->id}")
            ->assertOk();

        $this->assertCount(1, $response->json());
        $this->assertEquals(2, $response->json('0.pivot.coefficient'));

        $empty = $this->getJson("/api/series/{$this->serie->id}/matieres/coefficients?classe_id={$autreClasse->id}")
            ->assertOk();
        $this->assertCount(0, $empty->json());
    }

    private function asDirectorOf(Ecole $school, callable $callback)
    {
        $previous = auth()->user();
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]));
        $result = $callback();
        $this->actingAs($previous);
        return $result;
    }
}
