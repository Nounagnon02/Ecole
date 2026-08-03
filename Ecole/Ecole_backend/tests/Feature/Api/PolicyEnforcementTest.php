<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Enforcement of the Eloquent policies through the routes that expose them.
 *
 * The previous version of this file targeted `GET /api/notes/{id}` and
 * `GET /api/paiements/{id}`, neither of which is routed, and referenced
 * `App\Models\Parent` and an `eleves.parent_id` column, neither of which
 * exists. Every case therefore returned 404 for the wrong reason and the file
 * verified nothing. It now exercises the policies through the real endpoints.
 *
 * Two status codes with distinct meanings, deliberately:
 *   403 — the record is in your school but the policy denies you access.
 *   404 — the record belongs to another school. Answering 403 there would
 *         confirm that it exists, which is an information leak; the tenant
 *         scope makes it invisible instead.
 */
class PolicyEnforcementTest extends TestCase
{
    use RefreshDatabase;

    /* ─── ElevePolicy ─────────────────────────────────────────────────── */

    /** @test */
    public function a_student_cannot_read_another_students_record()
    {
        $school = Ecole::factory()->create();
        $mine   = Eleve::factory()->forSchool($school)->create();
        $other  = Eleve::factory()->forSchool($school)->create();

        $this->actingAs($mine->user)
            ->getJson("/api/eleves/{$other->id}")
            ->assertStatus(403);
    }

    /** @test */
    public function a_student_can_read_their_own_record()
    {
        $school = Ecole::factory()->create();
        $eleve  = Eleve::factory()->forSchool($school)->create();

        $this->actingAs($eleve->user)
            ->getJson("/api/eleves/{$eleve->id}")
            ->assertStatus(200)
            ->assertJsonPath('id', $eleve->id);
    }

    /** @test */
    public function a_head_teacher_can_read_any_record_in_their_school()
    {
        $school = $this->actingInSchool();
        $eleve  = Eleve::factory()->forSchool($school)->create();

        $this->getJson("/api/eleves/{$eleve->id}")
            ->assertStatus(200)
            ->assertJsonPath('id', $eleve->id);
    }

    /** @test */
    public function a_record_from_another_school_is_not_found_rather_than_forbidden()
    {
        $this->actingInSchool();

        $elsewhere = Eleve::factory()->forSchool(Ecole::factory()->create())->create();

        // 404, not 403: a 403 would confirm the record exists.
        $this->getJson("/api/eleves/{$elsewhere->id}")
            ->assertStatus(404);
    }

    /* ─── NotePolicy ──────────────────────────────────────────────────── */

    /** @test */
    public function a_student_cannot_read_another_students_grades()
    {
        $school = Ecole::factory()->create();
        $mine   = Eleve::factory()->forSchool($school)->create();
        $other  = Eleve::factory()->forSchool($school)->create();

        Notes::factory()->create(['eleve_id' => $other->id, 'ecole_id' => $school->id]);

        $this->actingAs($mine->user)
            ->getJson("/api/notes/eleve/{$other->id}")
            ->assertStatus(403);
    }

    /** @test */
    public function a_student_can_read_their_own_grades()
    {
        $school = Ecole::factory()->create();
        $eleve  = Eleve::factory()->forSchool($school)->create();

        Notes::factory()->create(['eleve_id' => $eleve->id, 'ecole_id' => $school->id]);

        $this->actingAs($eleve->user)
            ->getJson("/api/notes/eleve/{$eleve->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /** @test */
    public function a_parent_can_read_their_childs_grades()
    {
        $school = Ecole::factory()->create();
        $child  = Eleve::factory()->forSchool($school)->create();

        $parentUser = User::factory()->create(['role' => 'parent', 'ecole_id' => $school->id]);
        $parent = UserParent::factory()->create([
            'user_id'  => $parentUser->id,
            'ecole_id' => $school->id,
        ]);
        $parent->eleves()->attach($child->id);

        Notes::factory()->create(['eleve_id' => $child->id, 'ecole_id' => $school->id]);

        $this->actingAs($parentUser)
            ->getJson("/api/notes/eleve/{$child->id}")
            ->assertStatus(200);
    }

    /** @test */
    public function a_parent_cannot_read_an_unrelated_students_grades()
    {
        $school = Ecole::factory()->create();
        $stranger = Eleve::factory()->forSchool($school)->create();

        $parentUser = User::factory()->create(['role' => 'parent', 'ecole_id' => $school->id]);
        UserParent::factory()->create(['user_id' => $parentUser->id, 'ecole_id' => $school->id]);

        $this->actingAs($parentUser)
            ->getJson("/api/notes/eleve/{$stranger->id}")
            ->assertStatus(403);
    }

    /* ─── AbsencePolicy ───────────────────────────────────────────────── */

    /** @test */
    public function a_parent_cannot_record_an_absence()
    {
        $school = $this->actingInSchool(null, 'parent');
        $eleve  = Eleve::factory()->forSchool($school)->create();

        // The route is restricted to role:directeur,surveillant.
        $this->postJson('/api/surveillant/absences', [
            'eleve_id' => $eleve->id,
            'date'     => now()->toDateString(),
            'type'     => 'absence',
            'motif'    => 'Maladie',
        ])->assertStatus(403);
    }

    /** @test */
    public function a_supervisor_can_record_an_absence()
    {
        $school = $this->actingInSchool(null, 'surveillant');
        $eleve  = Eleve::factory()->forSchool($school)->create();

        $response = $this->postJson('/api/surveillant/absences', [
            'eleve_id' => $eleve->id,
            'date'     => now()->toDateString(),
            'type'     => 'absence',
            'motif'    => 'Maladie',
        ]);

        $this->assertContains(
            $response->status(),
            [200, 201],
            'A supervisor must be allowed to record an absence; got ' . $response->status()
        );
    }

    /* ─── Payment access ─────────────────────────────────────────────── */

    /** @test */
    public function an_accountant_can_list_payments_but_a_student_cannot()
    {
        $school = Ecole::factory()->create();
        $eleve  = Eleve::factory()->forSchool($school)->create();

        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        $this->actingAs($accountant)
            ->getJson('/api/comptable/paiements')
            ->assertStatus(200);

        $this->actingAs($eleve->user)
            ->getJson('/api/comptable/paiements')
            ->assertStatus(403);
    }
}
