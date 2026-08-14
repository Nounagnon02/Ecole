<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Emploi du temps — contrat API
 *
 * Vérifie que le scope tenant (BelongsToEcole) est respecté :
 * un comptable ne voit que les emplois du temps de son école.
 */
class EmploiDuTempsControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $director;
    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);

        $this->director = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);

        $this->teacher = User::factory()->create([
            'role' => 'enseignant',
            'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($this->director);
    }

    private function classe(): Classes
    {
        return Classes::factory()->create([
            'nom_classe' => '6ème A',
            'ecole_id' => $this->school->id,
        ]);
    }

    private function matiere(): Matieres
    {
        return Matieres::factory()->create([
            'nom' => 'Mathématiques',
            'ecole_id' => $this->school->id,
        ]);
    }

    private function enseignant(): Enseignant
    {
        return Enseignant::factory()->forSchool($this->school)->create();
    }

    /** @test */
    public function the_list_is_scoped_to_the_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        $otherClasse = $this->withoutTenantScope(
            fn() => Classes::factory()->create([
                'nom_classe' => '5ème B',
                'ecole_id' => $otherSchool->id,
            ])
        );

        $this->withoutTenantScope(fn() => EmploiDuTemps::factory()->create([
            'ecole_id' => $otherSchool->id,
            'classe_id' => $otherClasse->id,
            'jour' => 'Lundi',
            'heure_debut' => '08:00:00',
            'heure_fin' => '09:00:00',
        ]));

        $classe = $this->classe();
        $matiere = $this->matiere();
        $enseignant = $this->enseignant();

        EmploiDuTemps::factory()->create([
            'ecole_id' => $this->school->id,
            'classe_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'enseignant_id' => $enseignant->id,
            'jour' => 'Lundi',
            'heure_debut' => '08:00:00',
            'heure_fin' => '09:00:00',
        ]);

        $items = $this->getJson('/api/emploi-du-temps')->json('data');

        $this->assertCount(1, $items);
        $this->assertSame('Lundi', $items[0]['jour']);
    }

    /** @test */
    public function a_director_can_create_an_emploi_du_temps()
    {
        $this->withoutExceptionHandling();
        $classe = $this->classe();
        $matiere = $this->matiere();
        $enseignant = $this->enseignant();

        $response = $this->postJson('/api/emploi-du-temps/store', [
            'classe_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'enseignant_id' => (string) $enseignant->id,
            'jour' => 'Mardi',
            'heure_debut' => '09:00',
            'heure_fin' => '10:00',
            'salle' => 'Salle 101',
        ]);

        $response->assertStatus(201);

        $this->assertTrue($response->json('success'));
        $this->assertDatabaseHas('emplois_du_temps', [
            'classe_id' => $classe->id,
            'jour' => 'Mardi',
            'salle' => 'Salle 101',
        ]);
    }

    /** @test */
    public function a_director_can_update_an_emploi_du_temps()
    {
        $emploi = $this->withoutTenantScope(fn() => \App\Models\EmploiDuTemps::factory()->create([
            'ecole_id' => $this->school->id,
            'jour' => 'Lundi',
            'heure_debut' => '08:00:00',
            'heure_fin' => '09:00:00',
            'salle' => 'Salle A',
        ]));

        $response = $this->putJson("/api/emploi-du-temps/update/{$emploi->id}", [
            'salle' => 'Salle B',
            'heure_fin' => '10:00',
        ])->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertDatabaseHas('emplois_du_temps', [
            'id' => $emploi->id,
            'salle' => 'Salle B',
        ]);
    }

    /** @test */
    public function a_director_can_delete_an_emploi_du_temps()
    {
        $emploi = $this->withoutTenantScope(fn() => \App\Models\EmploiDuTemps::factory()->create([
            'ecole_id' => $this->school->id,
            'jour' => 'Jeudi',
        ]));

        $this->deleteJson("/api/emploi-du-temps/delete/{$emploi->id}")->assertOk();

        $this->assertDatabaseMissing('emplois_du_temps', ['id' => $emploi->id]);
    }

    /** @test */
    public function get_by_classe_returns_structured_data()
    {
        $classe = $this->classe();
        $matiere = $this->matiere();
        $enseignant = $this->enseignant();

        \App\Models\EmploiDuTemps::factory()->create([
            'ecole_id' => $this->school->id,
            'classe_id' => $classe->id,
            'matiere_id' => $matiere->id,
            'enseignant_id' => $enseignant->id,
            'jour' => 'Lundi',
            'heure_debut' => '08:00:00',
            'heure_fin' => '09:00:00',
            'salle' => 'Salle 101',
        ]);

        $response = $this->getJson('/api/emploi-du-temps/classe/' . $classe->id)->assertOk();

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('Lundi', $data[0]['jour']);
        $this->assertSame('Salle 101', $data[0]['salle']);
        $this->assertNotEmpty($data[0]['professeur']);
    }

    /** @test */
    public function a_teacher_can_read_emploi_du_temps()
    {
        $this->actingAs($this->teacher);

        $this->getJson('/api/emploi-du-temps')->assertOk();
    }

    /** @test */
    public function a_parent_can_read_emploi_du_temps()
    {
        $parent = User::factory()->create(['role' => 'parent', 'ecole_id' => $this->school->id]);
        $this->actingAs($parent);

        $this->getJson('/api/emploi-du-temps')->assertOk();
    }

    private function withoutTenantScope(callable $callback)
    {
        $director = auth()->user();

        $this->actingAs(User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => Ecole::latest('id')->first()->id,
        ]));

        $result = $callback();

        $this->actingAs($director);

        return $result;
    }
}