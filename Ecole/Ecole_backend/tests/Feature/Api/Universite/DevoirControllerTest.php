<?php

namespace Tests\Feature\Api\Universite;

use App\Models\Ecole;
use App\Models\User;
use App\Models\Universite\Devoir;
use App\Models\Universite\Enseignant;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Filiere;
use App\Models\Universite\Matiere;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Universite\DevoirController — aucun test dédié ne couvrait ce contrôleur.
 * Centré sur les points où une DevoirPolicy mal appliquée laisserait fuir
 * les copies ou les notes d'une autre filière/matière.
 */
class DevoirControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Filiere $filiere;
    private Matiere $matiere;
    private User $professeurUser;
    private Enseignant $professeur;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->filiere = Filiere::factory()->create(['ecole_id' => $this->school->id]);

        $this->professeurUser = User::factory()->create(['role' => 'professeur', 'ecole_id' => $this->school->id]);
        $this->professeur = Enseignant::factory()->forUser($this->professeurUser)->create();

        $this->matiere = Matiere::factory()->create([
            'ecole_id' => $this->school->id,
            'filiere_id' => $this->filiere->id,
            'enseignant_id' => $this->professeur->id,
        ]);
    }

    private function etudiant(?Filiere $filiere = null): array
    {
        $user = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $this->school->id]);
        $etudiant = Etudiant::factory()->create([
            'ecole_id' => $this->school->id,
            'filiere_id' => ($filiere ?? $this->filiere)->id,
            'user_id' => $user->id,
        ]);
        return [$user, $etudiant];
    }

    /** @test */
    public function a_lecturer_can_publish_an_assignment_on_a_subject_they_teach()
    {
        $response = $this->actingAs($this->professeurUser)->postJson('/api/universite/devoirs', [
            'matiere_id' => $this->matiere->id,
            'titre' => 'Dissertation',
            'publie' => true,
        ])->assertStatus(201);

        $this->assertDatabaseHas('uni_devoirs', ['id' => $response->json('data.id'), 'created_by' => $this->professeurUser->id]);
    }

    /** @test */
    public function a_lecturer_cannot_publish_an_assignment_on_a_subject_they_do_not_teach()
    {
        $otherMatiere = Matiere::factory()->create(['ecole_id' => $this->school->id, 'filiere_id' => $this->filiere->id]);

        $this->actingAs($this->professeurUser)->postJson('/api/universite/devoirs', [
            'matiere_id' => $otherMatiere->id,
            'titre' => 'Dissertation',
        ])->assertStatus(403);
    }

    /** @test */
    public function publishing_enrols_every_student_of_the_filiere()
    {
        [, $etudiant1] = $this->etudiant();
        [, $etudiant2] = $this->etudiant();
        [$autreUser] = $this->etudiant(Filiere::factory()->create(['ecole_id' => $this->school->id]));

        $devoirId = $this->actingAs($this->professeurUser)->postJson('/api/universite/devoirs', [
            'matiere_id' => $this->matiere->id,
            'titre' => 'Dissertation',
            'publie' => true,
        ])->json('data.id');

        $devoir = Devoir::find($devoirId);
        $this->assertTrue($devoir->etudiants()->whereKey($etudiant1->id)->exists());
        $this->assertTrue($devoir->etudiants()->whereKey($etudiant2->id)->exists());
        $this->assertSame(2, $devoir->etudiants()->count());
    }

    /** @test */
    public function a_student_sees_only_published_assignments_of_their_own_filiere()
    {
        [$user] = $this->etudiant();

        Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);
        Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => false]);

        $autreFiliere = Filiere::factory()->create(['ecole_id' => $this->school->id]);
        $autreMatiere = Matiere::factory()->create(['ecole_id' => $this->school->id, 'filiere_id' => $autreFiliere->id]);
        Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $autreMatiere->id, 'publie' => true]);

        $data = $this->actingAs($user)->getJson('/api/universite/devoirs')->assertOk()->json('data');

        $this->assertCount(1, $data);
    }

    /** @test */
    public function a_student_can_submit_to_their_own_assignment()
    {
        [$user, ] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);

        $this->actingAs($user)->postJson("/api/universite/devoirs/{$devoir->id}/soumettre", [
            'reponse' => 'Ma réponse',
        ])->assertOk();

        $this->assertTrue($devoir->etudiants()->whereKey($user->etudiant->id)->wherePivot('rendu', true)->exists());
    }

    /** @test */
    public function a_student_cannot_submit_to_an_assignment_outside_their_filiere()
    {
        $autreFiliere = Filiere::factory()->create(['ecole_id' => $this->school->id]);
        [$user, ] = $this->etudiant($autreFiliere);
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);

        $this->actingAs($user)->postJson("/api/universite/devoirs/{$devoir->id}/soumettre", [
            'reponse' => 'Intrusion',
        ])->assertForbidden();
    }

    /** @test */
    public function a_student_cannot_submit_to_an_unpublished_draft()
    {
        [$user, ] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => false]);

        $this->actingAs($user)->postJson("/api/universite/devoirs/{$devoir->id}/soumettre", [
            'reponse' => 'Trop tôt',
        ])->assertForbidden();
    }

    /** @test */
    public function submitting_a_disguised_html_file_is_rejected()
    {
        [$user, ] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);

        $this->actingAs($user)->postJson("/api/universite/devoirs/{$devoir->id}/soumettre", [
            'fichier' => UploadedFile::fake()->create('devoir.html', 10, 'text/html'),
        ])->assertStatus(422)->assertJsonValidationErrors(['fichier']);
    }

    /** @test */
    public function the_teaching_lecturer_can_grade_a_submission()
    {
        [$user, $etudiant] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);
        $devoir->etudiants()->attach($etudiant->id, ['rendu' => true, 'date_remise' => now()]);

        $this->actingAs($this->professeurUser)->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$etudiant->id}/noter", [
            'note' => 15.5,
        ])->assertOk();

        $this->assertEquals(15.5, $devoir->etudiants()->whereKey($etudiant->id)->first()->pivot->note);
    }

    /** @test */
    public function a_different_lecturer_cannot_grade_this_subjects_submissions()
    {
        [, $etudiant] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);
        $devoir->etudiants()->attach($etudiant->id, ['rendu' => true, 'date_remise' => now()]);

        $otherLecturerUser = User::factory()->create(['role' => 'professeur', 'ecole_id' => $this->school->id]);
        Enseignant::factory()->forUser($otherLecturerUser)->create();

        $this->actingAs($otherLecturerUser)->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$etudiant->id}/noter", [
            'note' => 20,
        ])->assertStatus(403);
    }

    /** @test */
    public function grading_a_student_not_enrolled_on_this_assignment_is_refused()
    {
        [, $etudiant] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);
        // Non inscrit : jamais soumis, jamais rattaché.

        $this->actingAs($this->professeurUser)->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$etudiant->id}/noter", [
            'note' => 20,
        ])->assertStatus(404);
    }

    /** @test */
    public function a_student_cannot_download_another_students_submission()
    {
        [$owner, $etudiantOwner] = $this->etudiant();
        [$intruder, ] = $this->etudiant();
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);
        $devoir->etudiants()->attach($etudiantOwner->id, ['rendu' => true, 'date_remise' => now(), 'fichier' => 'uni-devoirs/1/x.pdf']);

        $this->actingAs($intruder)
            ->getJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$etudiantOwner->id}/copie")
            ->assertStatus(403);
    }

    /** @test */
    public function a_lecturer_from_another_school_cannot_read_the_assignment()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $devoir = Devoir::factory()->create(['ecole_id' => $this->school->id, 'matiere_id' => $this->matiere->id, 'publie' => true]);

        $foreignLecturerUser = User::factory()->create(['role' => 'professeur', 'ecole_id' => $otherSchool->id]);

        $this->actingAs($foreignLecturerUser)->getJson("/api/universite/devoirs/{$devoir->id}")->assertStatus(404);
    }
}
