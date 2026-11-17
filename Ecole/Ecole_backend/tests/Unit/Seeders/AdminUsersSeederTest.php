<?php

namespace Tests\Unit\Seeders;

use App\Models\Ecole;
use App\Models\Enseignant;
use App\Models\User;
use Database\Seeders\AdminUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `AdminUsersSeeder` crée un `User` de rôle `enseignant` (compte de démo
 * `enseignant_ecole{id}`) mais ne lui donnait jamais de profil `Enseignant`.
 * `EnseignantController::notes()`, `::classes()`, etc. lisent `$user->enseignant`
 * et répondent 404 « Profil enseignant non trouvé » en son absence : le compte
 * de démonstration n'avait donc jamais accès à son propre espace enseignant.
 */
class AdminUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function the_seeded_teacher_account_has_a_linked_enseignant_profile()
    {
        Ecole::factory()->create(['status' => 'active']);

        $this->seed(AdminUsersSeeder::class);

        $teacher = User::where('identifiant', 'like', 'enseignant_ecole%')->firstOrFail();

        $this->assertTrue(
            Enseignant::withoutGlobalScope('ecole')->where('user_id', $teacher->id)->exists(),
            "Le compte enseignant de démonstration n'a pas de profil Enseignant lié."
        );
    }

    /** @test */
    public function running_the_seeder_twice_does_not_duplicate_the_profile()
    {
        Ecole::factory()->create(['status' => 'active']);

        $this->seed(AdminUsersSeeder::class);
        $this->seed(AdminUsersSeeder::class);

        $teacher = User::where('identifiant', 'like', 'enseignant_ecole%')->firstOrFail();

        $this->assertSame(
            1,
            Enseignant::withoutGlobalScope('ecole')->where('user_id', $teacher->id)->count()
        );
    }

    /** @test */
    public function each_school_gets_its_own_teacher_profile_correctly_scoped()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        $this->seed(AdminUsersSeeder::class);

        $teacherA = User::where('identifiant', 'enseignant_ecole' . $schoolA->id)->firstOrFail();
        $teacherB = User::where('identifiant', 'enseignant_ecole' . $schoolB->id)->firstOrFail();

        $profileA = Enseignant::withoutGlobalScope('ecole')->where('user_id', $teacherA->id)->firstOrFail();
        $profileB = Enseignant::withoutGlobalScope('ecole')->where('user_id', $teacherB->id)->firstOrFail();

        $this->assertSame($schoolA->id, $profileA->ecole_id);
        $this->assertSame($schoolB->id, $profileB->ecole_id);
    }
}
