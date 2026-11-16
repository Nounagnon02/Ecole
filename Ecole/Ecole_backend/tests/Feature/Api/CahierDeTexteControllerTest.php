<?php

namespace Tests\Feature\Api;

use App\Models\CahierDeTexte;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CahierDeTexteController — aucun test ne couvrait ce contrôleur avant
 * celui-ci.
 */
class CahierDeTexteControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $directeur;
    private Classes $classe;
    private Matieres $matiere;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->school->id]);
        $this->classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        $this->actingAs($this->directeur);
    }

    /** @test */
    public function a_teacher_can_log_their_own_lesson()
    {
        $teacherUser = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $enseignant = Enseignant::factory()->create(['user_id' => $teacherUser->id, 'ecole_id' => $this->school->id]);
        $this->actingAs($teacherUser);

        $response = $this->postJson('/api/cahier-texte', [
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'date' => '2026-02-10',
            'titre_lecon' => 'Les fractions',
            'contenu' => 'Introduction aux fractions',
        ])->assertStatus(201);

        $this->assertDatabaseHas('cahier_de_textes', [
            'id' => $response->json('id'),
            'enseignant_id' => $enseignant->id,
            'ecole_id' => $this->school->id,
        ]);
    }

    /** @test */
    public function a_director_can_log_a_lesson_on_behalf_of_a_teacher_of_their_school()
    {
        $enseignant = Enseignant::factory()->create(['ecole_id' => $this->school->id]);

        $this->postJson('/api/cahier-texte', [
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'date' => '2026-02-10',
            'titre_lecon' => 'Les fractions',
            'contenu' => 'Introduction aux fractions',
            'enseignant_id' => $enseignant->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('cahier_de_textes', ['enseignant_id' => $enseignant->id]);
    }

    /** @test */
    public function a_director_cannot_attribute_a_lesson_to_a_teacher_of_another_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignEnseignant = $this->asDirectorOf($otherSchool, fn () => Enseignant::factory()->create(['ecole_id' => $otherSchool->id]));

        $this->postJson('/api/cahier-texte', [
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'date' => '2026-02-10',
            'titre_lecon' => 'Les fractions',
            'contenu' => 'Introduction aux fractions',
            'enseignant_id' => $foreignEnseignant->id,
        ])->assertStatus(422)->assertJsonValidationErrors(['enseignant_id']);

        $this->assertDatabaseMissing('cahier_de_textes', ['enseignant_id' => $foreignEnseignant->id]);
    }

    /** @test */
    public function creating_without_a_teacher_when_the_caller_is_not_a_teacher_is_refused()
    {
        $this->postJson('/api/cahier-texte', [
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'date' => '2026-02-10',
            'titre_lecon' => 'Les fractions',
            'contenu' => 'Introduction aux fractions',
        ])->assertStatus(422);
    }

    /** @test */
    public function a_teacher_only_sees_their_own_lessons_in_the_index()
    {
        $teacherA = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $enseignantA = Enseignant::factory()->create(['user_id' => $teacherA->id, 'ecole_id' => $this->school->id]);
        $teacherB = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $enseignantB = Enseignant::factory()->create(['user_id' => $teacherB->id, 'ecole_id' => $this->school->id]);

        CahierDeTexte::create([
            'classe_id' => $this->classe->id, 'matiere_id' => $this->matiere->id,
            'enseignant_id' => $enseignantA->id, 'date' => '2026-02-01',
            'titre_lecon' => 'A', 'contenu' => 'x', 'ecole_id' => $this->school->id,
        ]);
        CahierDeTexte::create([
            'classe_id' => $this->classe->id, 'matiere_id' => $this->matiere->id,
            'enseignant_id' => $enseignantB->id, 'date' => '2026-02-02',
            'titre_lecon' => 'B', 'contenu' => 'y', 'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($teacherA);
        $data = $this->getJson('/api/cahier-texte')->assertOk()->json('data');

        $this->assertCount(1, $data);
        $this->assertSame('A', $data[0]['titre_lecon']);
    }

    /** @test */
    public function lessons_of_a_class_can_be_listed()
    {
        $enseignant = Enseignant::factory()->create(['ecole_id' => $this->school->id]);
        CahierDeTexte::create([
            'classe_id' => $this->classe->id, 'matiere_id' => $this->matiere->id,
            'enseignant_id' => $enseignant->id, 'date' => '2026-02-02',
            'titre_lecon' => 'B', 'contenu' => 'y', 'ecole_id' => $this->school->id,
        ]);

        $data = $this->getJson('/api/cahier-texte/classe/' . $this->classe->id)->assertOk()->json();
        $this->assertCount(1, $data);
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
