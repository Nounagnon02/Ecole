<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\Absence;
use App\Models\PaiementEleve;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PolicyEnforcementTest extends TestCase
{
    use RefreshDatabase;

    // ─── Élève Policy ─────────────────────────────────────────────────────

    /** @test */
    public function eleve_cannot_view_other_students()
    {
        $user = User::factory()->create(['role' => 'eleve']);
        $other = Eleve::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson("/api/eleves/{$other->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function directeur_can_view_any_eleve()
    {
        $user = User::factory()->create(['role' => 'directeur']);
        $eleve = Eleve::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson("/api/eleves/{$eleve->id}");

        $response->assertStatus(200);
    }

    // ─── Note Policy ──────────────────────────────────────────────────────

    /** @test */
    public function eleve_can_only_see_own_notes()
    {
        $user = User::factory()->create(['role' => 'eleve']);
        $note = Notes::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson("/api/notes/{$note->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function directeur_can_see_any_note()
    {
        $user = User::factory()->create(['role' => 'directeur']);
        $note = Notes::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson("/api/notes/{$note->id}");

        $response->assertStatus(200);
    }

    // ─── Paiement Policy ──────────────────────────────────────────────────

    /** @test */
    public function parent_can_see_children_payments()
    {
        $user = User::factory()->create(['role' => 'parent']);
        // Create parent with children setup
        $parent = \App\Models\Parent::factory()->create(['user_id' => $user->id]);
        $eleve = Eleve::factory()->create(['parent_id' => $parent->id]);
        $paiement = PaiementEleve::factory()->create(['eleve_id' => $eleve->id]);

        $response = $this->actingAs($user)
                         ->getJson("/api/paiements/{$paiement->id}");

        $response->assertStatus(200);
    }

    /** @test */
    public function comptable_can_see_any_payment()
    {
        $user = User::factory()->create(['role' => 'comptable']);
        $paiement = PaiementEleve::factory()->create();

        $response = $this->actingAs($user)
                         ->getJson("/api/paiements/{$paiement->id}");

        $response->assertStatus(200);
    }

    // ─── Absence Policy ───────────────────────────────────────────────────

    /** @test */
    public function surveillant_can_create_absence()
    {
        $user = User::factory()->create(['role' => 'surveillant']);

        $response = $this->actingAs($user)
                         ->postJson('/api/absences', [
                             'eleve_id' => 1,
                             'date' => now()->format('Y-m-d'),
                             'motif' => 'Maladie',
                         ]);

        // 422 is acceptable if eleve_id doesn't exist; we just want non-403
        $this->assertNotEquals(403, $response->status());
    }

    /** @test */
    public function parent_cannot_create_absence()
    {
        $user = User::factory()->create(['role' => 'parent']);

        $response = $this->actingAs($user)
                         ->postJson('/api/absences', [
                             'eleve_id' => 1,
                             'date' => now()->format('Y-m-d'),
                             'motif' => 'Maladie',
                         ]);

        // Parent is not in [directeur, enseignant, surveillant] for create
        $response->assertStatus(403);
    }

    // ─── Rate Limiting ────────────────────────────────────────────────────

    /** @test */
    public function auth_endpoint_is_rate_limited()
    {
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/auth/login', [
                'identifiant' => 'test@example.com',
                'password' => 'wrong',
            ]);
        }

        $response->assertStatus(429);
    }

    /** @test */
    public function health_endpoint_is_not_rate_limited()
    {
        for ($i = 0; $i < 10; $i++) {
            $response = $this->getJson('/api/health');
            $response->assertStatus(200);
        }
    }

    // ─── CORS & Security Headers ──────────────────────────────────────────

    /** @test */
    public function api_response_contains_security_headers()
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Content-Type-Options', 'nosniff')
                 ->assertHeader('X-Frame-Options', 'DENY');
    }
}
