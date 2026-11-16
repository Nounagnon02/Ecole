<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\ConseilClasse;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Examen;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CenseurController — aucun test ne couvrait ce contrôleur avant celui-ci.
 */
class CenseurControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $censeur;
    private Classes $classe;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->censeur = User::factory()->create([
            'role' => 'censeur',
            'ecole_id' => $this->school->id,
        ]);
        $this->classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->actingAs($this->censeur);
    }

    /** @test */
    public function resultats_reports_school_wide_statistics()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->classe->id]);
        $matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        Notes::factory()->create([
            'eleve_id' => $eleve->id,
            'classe_id' => $this->classe->id,
            'matiere_id' => $matiere->id,
            'note' => 15,
        ]);

        $this->getJson('/api/censeur/resultats')
            ->assertOk()
            ->assertJsonStructure(['stats', 'resultats']);
    }

    /** @test */
    public function resultats_does_not_fail_with_no_grades_at_all()
    {
        // Aucune note en base : `Notes::avg('note')` renvoie `null`.
        $this->getJson('/api/censeur/resultats')->assertOk();
    }

    /** @test */
    public function a_censeur_can_manage_conseils_de_classe()
    {
        $created = $this->postJson('/api/censeur/conseils-classe', [
            'classe_id' => $this->classe->id,
            'date' => '2026-06-15',
            'trimestre' => 'Trimestre 3',
            'participants' => ['Directeur', 'Censeur'],
            'decisions' => ['Passage en classe supérieure'],
        ])->assertStatus(201)->json('conseil');

        $this->assertDatabaseHas('conseils_classe', ['id' => $created['id'], 'ecole_id' => $this->school->id]);

        $this->getJson('/api/censeur/conseils-classe')->assertOk()->assertJsonCount(1);

        $this->putJson('/api/censeur/conseils-classe/' . $created['id'], ['statut' => 'termine'])
            ->assertOk()
            ->assertJsonPath('conseil.statut', 'termine');

        $this->deleteJson('/api/censeur/conseils-classe/' . $created['id'])->assertOk();
        $this->assertDatabaseMissing('conseils_classe', ['id' => $created['id']]);
    }

    /** @test */
    public function a_censeur_cannot_update_a_conseil_from_another_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignConseil = $this->asDirectorOf($otherSchool, fn () => ConseilClasse::create([
            'classe_id' => Classes::factory()->create(['ecole_id' => $otherSchool->id])->id,
            'date' => '2026-06-15',
            'trimestre' => 'Trimestre 3',
            'ecole_id' => $otherSchool->id,
        ]));

        $this->putJson('/api/censeur/conseils-classe/' . $foreignConseil->id, ['statut' => 'termine'])
            ->assertStatus(404);
    }

    /** @test */
    public function a_censeur_can_manage_examens()
    {
        $created = $this->postJson('/api/censeur/examens', [
            'nom' => 'Examen blanc',
            'type' => 'blanc',
            'date_debut' => '2026-06-01',
            'date_fin' => '2026-06-05',
            'classes' => [$this->classe->id],
        ])->assertStatus(201)->json('examen');

        $this->assertDatabaseHas('examens', ['id' => $created['id'], 'ecole_id' => $this->school->id]);

        $this->putJson('/api/censeur/examens/' . $created['id'], ['statut' => 'en_cours'])
            ->assertOk()
            ->assertJsonPath('examen.statut', 'en_cours');

        $this->deleteJson('/api/censeur/examens/' . $created['id'])->assertOk();
        $this->assertDatabaseMissing('examens', ['id' => $created['id']]);
    }

    /** @test */
    public function creating_an_examen_rejects_an_end_date_before_the_start_date()
    {
        $this->postJson('/api/censeur/examens', [
            'nom' => 'Examen invalide',
            'type' => 'blanc',
            'date_debut' => '2026-06-05',
            'date_fin' => '2026-06-01',
        ])->assertStatus(422)->assertJsonValidationErrors(['date_fin']);
    }

    /** @test */
    public function stats_chart_does_not_fail_with_no_data()
    {
        $this->getJson('/api/censeur/stats-chart')
            ->assertOk()
            ->assertJsonStructure(['moyennes', 'effectifs', 'repartition_notes']);
    }

    /** @test */
    public function stats_periode_reports_the_grade_distribution()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->classe->id]);
        $matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        Notes::factory()->create([
            'eleve_id' => $eleve->id, 'classe_id' => $this->classe->id, 'matiere_id' => $matiere->id,
            'note' => 17, 'periode' => 'trimestre1',
        ]);

        $this->getJson('/api/censeur/stats-periode?periode=trimestre1')
            ->assertOk()
            ->assertJsonPath('total_notes', 1);
    }

    /** @test */
    public function rapport_classe_lists_each_students_average()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->classe->id]);
        $eleve->user->update(['name' => 'Dossou', 'prenom' => 'Marie']);
        $matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
        Notes::factory()->create([
            'eleve_id' => $eleve->id, 'classe_id' => $this->classe->id, 'matiere_id' => $matiere->id, 'note' => 12,
        ]);

        $response = $this->getJson('/api/censeur/rapport-classe/' . $this->classe->id)->assertOk();

        $this->assertSame(1, $response->json('classe.effectif'));
        $this->assertSame('Dossou', $response->json('eleves.0.nom'));
        $this->assertEquals(12, $response->json('eleves.0.moyenne'));
    }

    /** @test */
    public function a_teacher_cannot_access_the_censeur_module()
    {
        $teacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $this->actingAs($teacher);

        $this->getJson('/api/censeur/resultats')->assertForbidden();
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
