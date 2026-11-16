<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PersonnelController — aucun test ne couvrait ce contrôleur avant celui-ci.
 *
 * `show`, `update` et `destroy` ont été retirés (non routés dans
 * routes/api/services.php, aucune référence côté frontend) : code mort,
 * même schéma que le nettoyage déjà fait sur trois autres contrôleurs.
 */
class PersonnelControllerTest extends TestCase
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
        $this->actingAs($this->directeur);
    }

    /** @test */
    public function a_director_can_hire_staff()
    {
        $response = $this->postJson('/api/personnel', [
            'name' => 'Dossou',
            'prenom' => 'Paul',
            'email' => 'paul.dossou@ecole.bj',
            'identifiant' => 'PAUL-001',
            'password' => 'motdepasse123',
            'poste' => 'Comptable',
            'salaire_base' => 150000,
            'date_embauche' => '2026-01-15',
            'type_contrat' => 'CDI',
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', ['identifiant' => 'PAUL-001', 'role' => 'personnel', 'ecole_id' => $this->school->id]);
        $this->assertDatabaseHas('personnel', ['poste' => 'Comptable', 'salaire_base' => 150000]);
    }

    /** @test */
    public function hiring_rejects_an_invalid_contract_type()
    {
        $this->postJson('/api/personnel', [
            'name' => 'X', 'prenom' => 'Y', 'email' => 'xy@ecole.bj',
            'identifiant' => 'XY-001', 'password' => 'motdepasse123',
            'poste' => 'Gardien', 'salaire_base' => 50000, 'date_embauche' => '2026-01-01',
            'type_contrat' => 'Bénévole',
        ])->assertStatus(422)->assertJsonValidationErrors(['type_contrat']);
    }

    /** @test */
    public function a_teacher_cannot_hire_staff()
    {
        $teacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);
        $this->actingAs($teacher);

        $this->postJson('/api/personnel', [
            'name' => 'X', 'prenom' => 'Y', 'email' => 'xy@ecole.bj',
            'identifiant' => 'XY-001', 'password' => 'motdepasse123',
            'poste' => 'Gardien', 'salaire_base' => 50000, 'date_embauche' => '2026-01-01',
            'type_contrat' => 'CDI',
        ])->assertForbidden();
    }

    /** @test */
    public function a_director_can_generate_a_payslip()
    {
        $personnel = Personnel::create([
            'user_id' => User::factory()->create(['role' => 'personnel', 'ecole_id' => $this->school->id])->id,
            'poste' => 'Comptable',
            'salaire_base' => 150000,
            'date_embauche' => '2026-01-01',
            'type_contrat' => 'CDI',
            'ecole_id' => $this->school->id,
        ]);

        $response = $this->postJson('/api/personnel/' . $personnel->id . '/fiche-paie', [
            'periode' => '2026-01',
            'primes' => 10000,
            'retenues' => 5000,
        ])->assertOk();

        $this->assertSame(155000, (int) $response->json('salaire_net'));
        $this->assertDatabaseHas('fiches_paie', ['user_id' => $personnel->user_id, 'periode' => '2026-01']);
    }

    /** @test */
    public function generating_the_same_payslip_twice_is_refused()
    {
        $personnel = Personnel::create([
            'user_id' => User::factory()->create(['role' => 'personnel', 'ecole_id' => $this->school->id])->id,
            'poste' => 'Comptable',
            'salaire_base' => 150000,
            'date_embauche' => '2026-01-01',
            'type_contrat' => 'CDI',
            'ecole_id' => $this->school->id,
        ]);

        $this->postJson('/api/personnel/' . $personnel->id . '/fiche-paie', ['periode' => '2026-01'])->assertOk();
        $this->postJson('/api/personnel/' . $personnel->id . '/fiche-paie', ['periode' => '2026-01'])->assertStatus(422);
    }
}
