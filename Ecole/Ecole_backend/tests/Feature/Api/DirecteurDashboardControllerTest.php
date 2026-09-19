<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * DirecteurDashboardController — aucun test ne couvrait ce contrôleur avant
 * celui-ci. Le point sensible, vu les bugs de cache déjà trouvés ailleurs
 * dans ce dashboard (audit P2/P3), est que le cache et les compteurs restent
 * cloisonnés par école.
 */
class DirecteurDashboardControllerTest extends TestCase
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
    public function directeur_reports_the_schools_counts()
    {
        $classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        Eleve::factory()->forSchool($this->school)->count(3)->create(['classe_id' => $classe->id]);

        $this->getJson('/api/dashboard/directeur')
            ->assertOk()
            ->assertJsonPath('data.total_eleves', 3)
            ->assertJsonPath('data.total_classes', 1);
    }

    /** @test */
    public function the_consolidated_dashboard_is_scoped_to_its_own_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $this->asDirectorOf($otherSchool, function () use ($otherSchool) {
            Eleve::factory()->forSchool($otherSchool)->count(5)->create();
        });

        Eleve::factory()->forSchool($this->school)->count(2)->create();

        $data = $this->getJson('/api/dashboard/directeur/data')->assertOk()->json('data');

        $this->assertSame(2, $data['stats']['total_eleves']);
        $this->assertCount(2, $data['eleves']);
    }

    /** @test */
    public function a_student_cannot_access_the_consolidated_dashboard()
    {
        $eleve = User::factory()->create(['role' => 'eleve', 'ecole_id' => $this->school->id]);
        $this->actingAs($eleve);

        $this->getJson('/api/dashboard/directeur/data')->assertStatus(403);
    }

    /** @test */
    public function the_dashboard_cache_is_isolated_per_school_and_can_be_invalidated()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        Eleve::factory()->forSchool($this->school)->count(1)->create();

        $first = $this->getJson('/api/dashboard/directeur/data')->json('data.stats.total_eleves');
        $this->assertSame(1, $first);

        // Un deuxième élève créé après la mise en cache : sans invalidation,
        // le cache de 5 minutes doit encore répondre l'ancien total.
        Eleve::factory()->forSchool($this->school)->count(1)->create();
        $cached = $this->getJson('/api/dashboard/directeur/data')->json('data.stats.total_eleves');
        $this->assertSame(1, $cached);

        $this->postJson('/api/dashboard/directeur/invalidate-cache')->assertOk();

        $fresh = $this->getJson('/api/dashboard/directeur/data')->json('data.stats.total_eleves');
        $this->assertSame(2, $fresh);

        // Le cache de l'autre école est une clé distincte : l'invalider ici
        // ne doit jamais l'avoir affectée.
        $this->asDirectorOf($otherSchool, function () {
            $this->assertSame(0, $this->getJson('/api/dashboard/directeur/data')->json('data.stats.total_eleves'));
        });
    }

    /** @test */
    public function unpaid_balances_only_count_this_schools_payments()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $this->asDirectorOf($otherSchool, function () use ($otherSchool) {
            PaiementEleve::factory()->create([
                'ecole_id' => $otherSchool->id,
                'eleve_id' => Eleve::factory()->forSchool($otherSchool)->create()->id,
                'montant_restant' => 999999,
            ]);
        });

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => Eleve::factory()->forSchool($this->school)->create()->id,
            'montant_restant' => 5000,
        ]);

        $data = $this->getJson('/api/dashboard/directeur/data')->json('data');
        $this->assertEquals(5000.0, $data['finances']['impayes']);
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
