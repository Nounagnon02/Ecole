<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * A school is deactivated, never deleted.
 *
 * 62 tables used to cascade on `ecoles.id`, so one hard delete erased an entire
 * establishment — pupils, marks, report cards, payments, medical records — with
 * no undo. The constraints are now RESTRICT, deletion is not offered, and
 * deactivation actually cuts off access instead of only setting a column that
 * nothing read.
 */
class SchoolDeactivationTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);
    }

    /* ─── The database refuses to lose a school ───────────────────────── */

    /** @test */
    public function deleting_a_school_that_still_holds_data_is_refused_by_the_database()
    {
        $school = Ecole::factory()->create();
        Eleve::factory()->forSchool($school)->create();

        // SQLite only enforces foreign keys when asked to.
        DB::statement('PRAGMA foreign_keys = ON');

        $this->expectException(\Illuminate\Database\QueryException::class);

        // A hard delete must fail rather than cascade the establishment away.
        DB::table('ecoles')->where('id', $school->id)->delete();
    }

    /** @test */
    public function no_table_cascades_on_the_school_foreign_key()
    {
        $cascading = [];

        foreach (Schema::getTables() as $table) {
            foreach (Schema::getForeignKeys($table['name']) as $fk) {
                if (in_array('ecole_id', $fk['columns'] ?? [], true)
                    && strtolower((string) ($fk['on_delete'] ?? '')) === 'cascade') {
                    $cascading[] = $table['name'];
                }
            }
        }

        $this->assertSame(
            [],
            $cascading,
            'Ces tables cascadent encore sur ecole_id : ' . implode(', ', $cascading)
        );
    }

    /** @test */
    public function the_framework_migrations_table_is_not_scoped_to_a_school()
    {
        // An earlier catch-all migration added ecole_id to Laravel's own
        // bookkeeping table.
        $this->assertFalse(Schema::hasColumn('migrations', 'ecole_id'));
    }

    /* ─── DELETE deactivates instead of deleting ──────────────────────── */

    /** @test */
    public function deleting_a_school_through_the_api_deactivates_it_and_keeps_its_data()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $eleve  = Eleve::factory()->forSchool($school)->create();

        $this->actingAs($this->superAdmin())
            ->deleteJson("/api/ecoles/{$school->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame('inactive', $school->fresh()->status);
        // The school row and its data are still there.
        $this->assertDatabaseHas('ecoles', ['id' => $school->id]);
        $this->assertDatabaseHas('eleves', ['id' => $eleve->id]);
    }

    /** @test */
    public function a_school_can_be_deactivated_then_reactivated()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $admin  = $this->superAdmin();

        $this->actingAs($admin)
            ->postJson("/api/ecoles/{$school->id}/deactivate")
            ->assertStatus(200);
        $this->assertSame('inactive', $school->fresh()->status);

        $this->actingAs($admin)
            ->postJson("/api/ecoles/{$school->id}/activate")
            ->assertStatus(200);
        $this->assertSame('active', $school->fresh()->status);
    }

    /** @test */
    public function only_a_platform_super_admin_can_deactivate_a_school()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $head   = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $this->actingAs($head)
            ->postJson("/api/ecoles/{$school->id}/deactivate")
            ->assertStatus(403);

        $this->assertSame('active', $school->fresh()->status);
    }

    /* ─── Deactivation actually cuts off access ───────────────────────── */

    /** @test */
    public function a_user_of_a_deactivated_school_cannot_sign_in()
    {
        $school = Ecole::factory()->create(['status' => 'inactive']);
        $user   = User::factory()->create([
            'role'        => 'directeur',
            'ecole_id'    => $school->id,
            'identifiant' => 'head.suspended',
        ]);

        $this->postJson('/api/auth/login', [
            'identifiant' => 'head.suspended',
            'password'    => 'password',
        ])->assertStatus(403);
    }

    /** @test */
    public function the_same_user_can_sign_in_once_the_school_is_active_again()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        User::factory()->create([
            'role'        => 'directeur',
            'ecole_id'    => $school->id,
            'identifiant' => 'head.active',
        ]);

        $this->postJson('/api/auth/login', [
            'identifiant' => 'head.active',
            'password'    => 'password',
        ])->assertStatus(200);
    }

    /** @test */
    public function an_open_session_stops_working_when_the_school_is_deactivated()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user   = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        // Works while the school is active.
        $this->actingAs($user)->getJson('/api/auth/me')->assertStatus(200);

        // Deactivating must cut the session off, not merely block future logins.
        $school->update(['status' => 'inactive']);
        Cache::forget("school_active_{$school->id}");

        $this->actingAs($user)->getJson('/api/auth/me')->assertStatus(403);
    }

    /** @test */
    public function a_platform_super_admin_is_never_locked_out_by_a_suspended_school()
    {
        $school = Ecole::factory()->create(['status' => 'inactive']);

        // A super-admin attached to a school must still get in — otherwise
        // suspending an establishment would lock out the account needed to
        // reactivate it.
        $admin = User::factory()->create([
            'role'        => 'super-admin',
            'ecole_id'    => $school->id,
            'identifiant' => 'platform.admin',
        ]);

        $this->postJson('/api/auth/login', [
            'identifiant' => 'platform.admin',
            'password'    => 'password',
        ])->assertStatus(200);

        $this->actingAs($admin)->getJson('/api/auth/me')->assertStatus(200);
    }
}
