<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `EnseignantController::store()` n'avait aucun test avant celui-ci.
 *
 * `ecole_id` était pris tel quel dans le corps de la requête, seulement
 * vérifié `exists:ecoles,id` (n'importe quel établissement de la plateforme).
 * La route n'est gardée que par `role:directeur` (routes/api/users.php) — un
 * rôle d'établissement, pas transverse : un directeur pouvait donc créer un
 * compte enseignant dans l'école de son choix. Corrigé en fixant l'école sur
 * celle de l'appelant, comme partout ailleurs pour ce type de création.
 */
class EnseignantControllerStoreTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $directeur;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
    }

    /** @test */
    public function a_director_can_register_a_teacher()
    {
        $response = $this->actingAs($this->directeur)->postJson('/api/enseignants/store', [
            'name' => 'Agossou',
            'prenom' => 'Paul',
            'email' => 'paul.agossou@ecole.bj',
            'identifiant' => 'ENS-STORE-001',
            'password' => 'motdepasse123',
            'role' => 'enseignant',
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'identifiant' => 'ENS-STORE-001',
            'ecole_id' => $this->school->id,
        ]);
        $this->assertDatabaseHas('enseignants', [
            'user_id' => $response->json('user.id'),
        ]);
    }

    /** @test */
    public function a_client_supplied_ecole_id_is_ignored()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        $this->actingAs($this->directeur)->postJson('/api/enseignants/store', [
            'name' => 'Agossou',
            'prenom' => 'Paul',
            'email' => 'paul2.agossou@ecole.bj',
            'identifiant' => 'ENS-STORE-002',
            'password' => 'motdepasse123',
            'role' => 'enseignant',
            'ecole_id' => $otherSchool->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'identifiant' => 'ENS-STORE-002',
            'ecole_id' => $this->school->id,
        ]);
        $this->assertDatabaseMissing('users', [
            'identifiant' => 'ENS-STORE-002',
            'ecole_id' => $otherSchool->id,
        ]);
    }
}
