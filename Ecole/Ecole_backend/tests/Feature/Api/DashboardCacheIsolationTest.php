<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Isolation du cache des dashboards par école résolue (audit P2).
 *
 * Les clés étaient indexées sur `auth()->id()` (staff) ou sur `user->ecole_id`
 * (directeur/admin/universite). Pour un super-admin, ce champ est null — alors
 * que le scope `ecole` s'appuie sur l'école posée en session par `EcoleScope`
 * depuis `X-Ecole-Id` : deux établissements partageaient donc la même clé, et
 * le second récupérait la charge du premier. Ces tests verrouillent le
 * comportement corrigé : la clé dépend de l'école résolue.
 */
class DashboardCacheIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);
    }

    private function getDirectoryData(string $ecoleIdHeader): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders(['X-Ecole-Id' => $ecoleIdHeader])
            ->getJson('/api/dashboard/directeur/data');
    }

    /** @test */
    public function switching_schools_as_super_admin_never_reuses_the_directory_cache()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);

        Eleve::factory()->forSchool($schoolA)->count(3)->create();
        Eleve::factory()->forSchool($schoolB)->count(7)->create();

        $this->actingAs($this->superAdmin());

        // École A : le payload est calculé puis mis en cache sous la clé de A.
        $this->getDirectoryData((string) $schoolA->id)
            ->assertStatus(200)
            ->assertJsonPath('data.stats.total_eleves', 3);

        // École B : avec une clé partagée ('global'), le cache renverrait la
        // charge de l'école A — c'est l'empoisonnement. La clé doit être
        // distincte par école résolue, donc B doit être recalculé.
        $this->getDirectoryData((string) $schoolB->id)
            ->assertStatus(200)
            ->assertJsonPath('data.stats.total_eleves', 7);
    }

    /** @test */
    public function non_directory_roles_are_blocked_from_the_directory_data_route()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $eleve = User::factory()->create(['role' => 'eleve', 'ecole_id' => $school->id]);

        $this->actingAs($eleve)
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(403);
    }

    /** @test */
    public function censeur_can_still_read_the_directory_data_route()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $censeur = User::factory()->create(['role' => 'censeur', 'ecole_id' => $school->id]);

        $this->actingAs($censeur)
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(200);
    }

    /** @test */
    public function the_legacy_tenant_route_carries_the_directory_role_middleware()
    {
        $route = collect(app('router')->getRoutes())->first(
            fn ($route) => $route->uri() === 'api/v1/dashboard/{role}/data'
        );

        $this->assertNotNull($route, 'La route legacy api/v1/dashboard/{role}/data doit exister.');
        $this->assertContains('role:directeur,censeur,secretaire', $route->gatherMiddleware());
    }
}
