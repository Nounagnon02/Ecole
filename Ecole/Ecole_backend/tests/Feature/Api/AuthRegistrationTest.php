<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Inscription d'utilisateurs et sélection d'école.
 *
 * Aucun test ne couvrait `AuthController::inscription()` ni `selectSchool()`
 * avant celui-ci — les deux endpoints étaient réécrits (extraction en
 * FormRequest) sans filet.
 */
class AuthRegistrationTest extends TestCase
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
    public function a_director_can_register_a_staff_member()
    {
        $response = $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Kouassi',
            'prenom' => 'Aya',
            'role' => 'comptable',
            'email' => 'aya.kouassi@ecole.bj',
            'identifiant' => 'AYA-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
            'telephone' => '0100000000',
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'identifiant' => 'AYA-001',
            'role' => 'comptable',
            'ecole_id' => $this->school->id,
        ]);
    }

    /** @test */
    public function registering_a_student_also_creates_the_eleve_profile()
    {
        $classe = Classes::factory()->create(['ecole_id' => $this->school->id]);

        $response = $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Dossou',
            'prenom' => 'Marie',
            'role' => 'eleve',
            'identifiant' => 'ELEVE-2026-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
            'numero_matricule' => 'MAT-2026-9001',
            'classe_id' => $classe->id,
        ])->assertStatus(201);

        $userId = $response->json('user.id');
        $this->assertDatabaseHas('eleves', [
            'user_id' => $userId,
            'numero_matricule' => 'MAT-2026-9001',
            'classe_id' => $classe->id,
        ]);
    }

    /** @test */
    public function registering_a_student_requires_the_student_specific_fields()
    {
        $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Dossou',
            'prenom' => 'Marie',
            'role' => 'eleve',
            'identifiant' => 'ELEVE-2026-002',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['numero_matricule', 'classe_id']);
    }

    /** @test */
    public function registering_a_teacher_also_creates_the_enseignant_profile()
    {
        $response = $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Agossou',
            'prenom' => 'Paul',
            'role' => 'enseignant',
            'identifiant' => 'ENS-2026-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('enseignants', ['user_id' => $response->json('user.id')]);
    }

    /** @test */
    public function registering_a_parent_also_creates_the_parent_profile()
    {
        $response = $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Houngbo',
            'prenom' => 'Sara',
            'role' => 'parent',
            'identifiant' => 'PAR-2026-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('parents', ['user_id' => $response->json('user.id')]);
    }

    /**
     * `ecole_id` était pris tel quel dans le corps de la requête et seulement
     * vérifié `exists:ecoles,id` : un directeur pouvait inscrire un compte
     * dans l'école de son choix, pas seulement la sienne.
     */
    /** @test */
    public function a_director_cannot_register_a_user_into_another_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Kouassi',
            'prenom' => 'Aya',
            'role' => 'comptable',
            'identifiant' => 'AYA-002',
            'password' => 'motdepasse123',
            'ecole_id' => $otherSchool->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'identifiant' => 'AYA-002',
            'ecole_id' => $this->school->id,
        ]);
        $this->assertDatabaseMissing('users', [
            'identifiant' => 'AYA-002',
            'ecole_id' => $otherSchool->id,
        ]);
    }

    /** @test */
    public function a_super_admin_can_register_a_user_into_a_chosen_school()
    {
        $superAdmin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);
        $targetSchool = Ecole::factory()->create(['status' => 'active']);

        $this->actingAs($superAdmin)->postJson('/api/inscription', [
            'name' => 'Kouassi',
            'prenom' => 'Aya',
            'role' => 'comptable',
            'identifiant' => 'AYA-003',
            'password' => 'motdepasse123',
            'ecole_id' => $targetSchool->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'identifiant' => 'AYA-003',
            'ecole_id' => $targetSchool->id,
        ]);
    }

    /** @test */
    public function registration_rejects_a_role_reserved_for_the_platform()
    {
        $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'X', 'prenom' => 'Y', 'role' => 'super-admin',
            'identifiant' => 'X-002', 'password' => 'motdepasse123', 'ecole_id' => $this->school->id,
        ])->assertStatus(422)->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function a_teacher_cannot_register_users()
    {
        $teacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);

        $this->actingAs($teacher)->postJson('/api/inscription', [
            'name' => 'X', 'prenom' => 'Y', 'role' => 'comptable',
            'identifiant' => 'X-001', 'password' => 'motdepasse123', 'ecole_id' => $this->school->id,
        ])->assertForbidden();
    }

    /** @test */
    public function registration_rejects_a_duplicate_identifiant()
    {
        User::factory()->create(['identifiant' => 'DUP-001', 'ecole_id' => $this->school->id]);

        $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Z', 'prenom' => 'Z', 'role' => 'comptable',
            'identifiant' => 'DUP-001', 'password' => 'motdepasse123', 'ecole_id' => $this->school->id,
        ])->assertStatus(422)->assertJsonValidationErrors(['identifiant']);
    }

    /**
     * Verrou de régression : un `ValidationException` levé APRÈS
     * `DB::beginTransaction()` (ici, la validation conditionnelle des champs
     * élève) doit laisser la transaction proprement fermée. `AuthController`
     * appelait `rethrowIfMeaningful()` avant `DB::rollBack()` : l'exception
     * repartait avant que le rollback ne s'exécute, laissant la comptabilité
     * de transactions de Laravel désynchronisée de la connexion PDO réelle.
     *
     * Le symptôme (« there is already an active transaction ») n'apparaît
     * qu'entre deux requêtes sur une connexion réutilisée (worker de file,
     * connexions persistantes) — invisible dans un test qui n'observe qu'une
     * requête. On vérifie directement la profondeur de transaction Laravel
     * (`DB::transactionLevel()`), qui doit revenir à sa valeur d'avant-requête
     * que l'inscription réussisse ou échoue.
     */
    /** @test */
    public function a_validation_failure_mid_transaction_does_not_leave_it_open()
    {
        $niveauAvant = \Illuminate\Support\Facades\DB::transactionLevel();

        $this->actingAs($this->directeur)->postJson('/api/inscription', [
            'name' => 'Dossou',
            'prenom' => 'Marie',
            'role' => 'eleve',
            'identifiant' => 'ELEVE-TX-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
            // `classe_id` manquant : la validation imbriquée échoue alors que
            // la transaction de `inscription()` est déjà ouverte.
        ])->assertStatus(422);

        $this->assertSame($niveauAvant, \Illuminate\Support\Facades\DB::transactionLevel());
    }

    /* ─── selectSchool ──────────────────────────────────────────────── */

    /** @test */
    public function a_platform_account_can_select_an_active_school()
    {
        $superAdmin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);

        $response = $this->actingAs($superAdmin)->postJson('/api/auth/select-school', [
            'ecole_id' => $this->school->id,
        ])->assertOk();

        $this->assertSame($this->school->id, $response->json('ecole_id'));
        $this->assertSame($this->school->id, session('ecole_id'));
    }

    /** @test */
    public function an_account_with_its_own_school_cannot_select_another_one()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        $this->actingAs($this->directeur)->postJson('/api/auth/select-school', [
            'ecole_id' => $otherSchool->id,
        ])->assertForbidden();
    }

    /** @test */
    public function an_account_without_a_school_and_without_platform_role_has_nothing_to_select()
    {
        $orphan = User::factory()->create(['role' => 'comptable', 'ecole_id' => null]);

        $this->actingAs($orphan)->postJson('/api/auth/select-school', [
            'ecole_id' => $this->school->id,
        ])->assertForbidden();
    }

    /** @test */
    public function selecting_a_nonexistent_school_fails_validation()
    {
        $superAdmin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);

        $this->actingAs($superAdmin)->postJson('/api/auth/select-school', [
            'ecole_id' => 999999,
        ])->assertStatus(422)->assertJsonValidationErrors(['ecole_id']);
    }
}
