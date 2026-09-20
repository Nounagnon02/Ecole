<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Cloisonnement du dashboard admin (audit A3).
 *
 * `User` est exempté du scope `ecole` — la connexion doit pouvoir trouver un
 * compte avant de connaître son école. L'exemption impose un filtrage manuel
 * partout ailleurs, et `AdminDashboardController` ne le faisait pas : les
 * compteurs d'utilisateurs, la répartition des rôles, la liste des comptes
 * récents et le journal d'audit étaient calculés toutes écoles confondues,
 * alors que la route est ouverte au rôle `admin`, qui est un rôle
 * d'établissement.
 *
 * Ces tests verrouillent les deux moitiés du contrat : un `admin` ne voit que
 * son école, un `super-admin` sans école ciblée garde la vue plateforme.
 */
class AdminDashboardTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /** @test */
    public function an_admin_never_counts_users_from_another_school()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $schoolA->id]);
        User::factory()->count(2)->create(['role' => 'enseignant', 'ecole_id' => $schoolA->id]);
        User::factory()->count(7)->create(['role' => 'enseignant', 'ecole_id' => $schoolB->id]);

        $data = $this->actingAs($admin)
            ->getJson('/api/dashboard/admin')
            ->assertStatus(200)
            ->json('data');

        // 1 admin + 2 enseignants de l'école A. Les 7 de l'école B sont hors champ.
        $this->assertSame(3, $data['utilisateurs_total']);
        $this->assertSame(1, $data['ecoles']);

        $emails = collect($data['utilisateurs'])->pluck('email');
        $etrangers = User::where('ecole_id', $schoolB->id)->pluck('email');
        foreach ($etrangers as $email) {
            $this->assertNotContains($email, $emails, "Le compte {$email} de l'école B ne doit pas apparaître.");
        }
    }

    /** @test */
    public function an_admin_never_reads_the_audit_trail_of_another_school()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $schoolA->id]);

        $this->auditEntry($schoolB->id, 'secret-de-lecole-b');
        $this->auditEntry($schoolA->id, 'action-de-lecole-a');

        $data = $this->actingAs($admin)
            ->getJson('/api/dashboard/admin')
            ->assertStatus(200)
            ->json('data');

        $types = collect($data['activites_recentes'])->pluck('type');

        $this->assertContains('action-de-lecole-a', $types);
        $this->assertNotContains('secret-de-lecole-b', $types);
    }

    /**
     * Écrire une entrée d'audit rattachée à une école précise, sans passer par
     * le scope : le test a justement besoin de poser la ligne que la lecture
     * ne devra pas retrouver.
     */
    private function auditEntry(int $ecoleId, string $event): void
    {
        AuditLog::withoutGlobalScope('ecole')->forceCreate([
            'ecole_id'       => $ecoleId,
            'event'          => $event,
            'auditable_type' => \App\Models\User::class,
            'auditable_id'   => 1,
        ]);
    }

    /** @test */
    public function a_super_admin_without_a_target_school_keeps_the_platform_view()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        User::factory()->count(2)->create(['role' => 'enseignant', 'ecole_id' => $schoolA->id]);
        User::factory()->count(3)->create(['role' => 'enseignant', 'ecole_id' => $schoolB->id]);

        $superAdmin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);

        $data = $this->actingAs($superAdmin)
            ->getJson('/api/dashboard/admin')
            ->assertStatus(200)
            ->json('data');

        // 5 enseignants + le super-admin lui-même, sur les deux écoles.
        $this->assertSame(6, $data['utilisateurs_total']);
        $this->assertSame(2, $data['ecoles']);
    }
}
