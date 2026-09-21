<?php

namespace Tests\Feature\Api;

use App\Models\AuditLog;
use App\Models\Ecole;
use App\Models\User;
use App\Support\SchoolContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `AuditLog`/`Auditable` existaient et étaient alimentés depuis longtemps
 * (`User`, `Notes`), mais jamais consultables au-delà d'un widget de 10
 * entrées sur le dashboard admin. `AuditLogController::index` est la
 * première vraie page de consultation, avec recherche/filtre.
 */
class AuditLogControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeLog(int $ecoleId, array $overrides = [])
    {
        return SchoolContext::for($ecoleId, fn () => AuditLog::create(array_merge([
            'ecole_id' => $ecoleId,
            'event' => 'updated',
            'auditable_type' => \App\Models\Notes::class,
            'auditable_id' => 1,
            'old_values' => ['valeur' => 10],
            'new_values' => ['valeur' => 15],
        ], $overrides)));
    }

    /** @test */
    public function a_director_sees_only_their_own_schools_audit_trail()
    {
        $schoolA = Ecole::factory()->create(['status' => 'active']);
        $schoolB = Ecole::factory()->create(['status' => 'active']);
        // La création elle-même déclenche déjà une entrée d'audit (`User`
        // porte `Auditable`) : le test filtre sur `auditable_type=Notes`
        // pour ne compter que les entrées qu'il a lui-même posées, sans
        // dépendre du nombre d'entrées que la fixture génère en bruit.
        $director = User::factory()->create(['role' => 'directeur', 'ecole_id' => $schoolA->id]);

        $this->makeLog($schoolA->id);
        $this->makeLog($schoolB->id);

        $response = $this->actingAs($director)
            ->getJson('/api/audit-logs?auditable_type=Notes')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame($schoolA->id, AuditLog::find($response->json('data.0.id'))->ecole_id);
    }

    /** @test */
    public function staff_roles_cannot_read_the_audit_trail()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        $this->actingAs($accountant)->getJson('/api/audit-logs')->assertForbidden();
    }

    /** @test */
    public function it_filters_by_event_type_and_model()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $director = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $this->makeLog($school->id, ['event' => 'created', 'auditable_type' => User::class]);
        $this->makeLog($school->id, ['event' => 'updated', 'auditable_type' => \App\Models\Notes::class]);

        $response = $this->actingAs($director)
            ->getJson('/api/audit-logs?event=updated&auditable_type=Notes')
            ->assertOk();

        $entries = $response->json('data');
        $this->assertCount(1, $entries);
        $this->assertSame('updated', $entries[0]['event']);
    }

    /** @test */
    public function the_diff_decodes_to_real_arrays_not_a_json_string()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $director = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $this->makeLog($school->id);

        $response = $this->actingAs($director)->getJson('/api/audit-logs')->assertOk();

        $this->assertSame(10, $response->json('data.0.old_values.valeur'));
        $this->assertSame(15, $response->json('data.0.new_values.valeur'));
    }
}
