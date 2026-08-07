<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\CahierDeTexte;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Enseignant;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\PaiementEleve;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The endpoints added to close the frontend/API gap.
 *
 * The frontend was calling all of these; none existed, so the corresponding
 * pages rendered empty. Each one is covered here, and the per-child parent
 * endpoints are checked for scope: without that, a parent could read another
 * family's grades, absences or payments by changing the id in the URL.
 */
class NewEndpointsTest extends TestCase
{
    use RefreshDatabase;

    /** Create a parent, one child of theirs, and one unrelated child. */
    private function family(Ecole $school): array
    {
        $child     = Eleve::factory()->forSchool($school)->create();
        $stranger  = Eleve::factory()->forSchool($school)->create();

        $parentUser = User::factory()->create(['role' => 'parent', 'ecole_id' => $school->id]);
        $parent = UserParent::factory()->create([
            'user_id'  => $parentUser->id,
            'ecole_id' => $school->id,
        ]);
        $parent->eleves()->attach($child->id);

        return [$parentUser, $child, $stranger];
    }

    /* ─── Parent, per child ───────────────────────────────────────────── */

    /** @test */
    public function a_parent_reads_their_childs_grades_absences_timetable_and_payments()
    {
        $school = Ecole::factory()->create();
        [$parentUser, $child] = $this->family($school);

        Notes::factory()->create(['eleve_id' => $child->id, 'ecole_id' => $school->id]);
        Absence::factory()->create(['eleve_id' => $child->id, 'ecole_id' => $school->id]);
        PaiementEleve::factory()->create(['eleve_id' => $child->id, 'ecole_id' => $school->id]);

        foreach (['notes', 'absences', 'emploi-du-temps', 'paiements'] as $resource) {
            $this->actingAs($parentUser)
                ->getJson("/api/parent/enfants/{$child->id}/{$resource}")
                ->assertStatus(200)
                ->assertJsonPath('success', true);
        }
    }

    /** @test */
    public function a_parent_cannot_read_an_unrelated_childs_data()
    {
        $school = Ecole::factory()->create();
        [$parentUser, , $stranger] = $this->family($school);

        // 404 rather than 403: a 403 would confirm the child exists.
        foreach (['notes', 'absences', 'emploi-du-temps', 'paiements'] as $resource) {
            $this->actingAs($parentUser)
                ->getJson("/api/parent/enfants/{$stranger->id}/{$resource}")
                ->assertStatus(404);
        }
    }

    /** @test */
    public function the_payment_endpoint_reports_the_outstanding_balance()
    {
        $school = Ecole::factory()->create();
        [$parentUser, $child] = $this->family($school);

        PaiementEleve::factory()->create([
            'eleve_id'        => $child->id,
            'ecole_id'        => $school->id,
            'montant_total'   => 100000,
            'montant_paye'    => 40000,
            'montant_restant' => 60000,
        ]);

        $this->actingAs($parentUser)
            ->getJson("/api/parent/enfants/{$child->id}/paiements")
            ->assertStatus(200)
            ->assertJsonPath('meta.total_du', 100000)
            ->assertJsonPath('meta.total_paye', 40000)
            ->assertJsonPath('meta.solde', 60000);
    }

    /* ─── Grade aggregates ────────────────────────────────────────────── */

    /** @test */
    public function grade_statistics_normalise_marks_to_a_scale_of_twenty()
    {
        $school = $this->actingInSchool();
        $eleve  = Eleve::factory()->forSchool($school)->create();

        // 8 out of 10 must count as 16/20, not 8/20.
        Notes::factory()->create([
            'eleve_id' => $eleve->id,
            'ecole_id' => $school->id,
            'note'     => 8,
            'note_sur' => 10,
        ]);

        $response = $this->getJson('/api/notes/stats')->assertStatus(200);

        $this->assertSame(1, $response->json('data.total_notes'));
        $this->assertEquals(16, $response->json('data.moyenne'));
        $this->assertSame(1, $response->json('data.repartition.tres_bien'));
    }

    /** @test */
    public function a_student_only_sees_their_own_figures_in_the_aggregates()
    {
        $school = Ecole::factory()->create();
        $mine   = Eleve::factory()->forSchool($school)->create();
        $other  = Eleve::factory()->forSchool($school)->create();

        Notes::factory()->create(['eleve_id' => $mine->id, 'ecole_id' => $school->id, 'note' => 15, 'note_sur' => 20]);
        Notes::factory()->count(3)->create(['eleve_id' => $other->id, 'ecole_id' => $school->id, 'note' => 5, 'note_sur' => 20]);

        $response = $this->actingAs($mine->user)
            ->getJson('/api/notes/stats')
            ->assertStatus(200);

        // Only their own single mark, not the other student's three.
        $this->assertSame(1, $response->json('data.total_notes'));
        $this->assertEquals(15, $response->json('data.moyenne'));
    }

    /** @test */
    public function per_subject_averages_are_grouped_by_subject()
    {
        $school  = $this->actingInSchool();
        $eleve   = Eleve::factory()->forSchool($school)->create();
        $maths   = Matieres::factory()->create(['ecole_id' => $school->id]);
        $french  = Matieres::factory()->create(['ecole_id' => $school->id]);

        Notes::factory()->create(['eleve_id' => $eleve->id, 'matiere_id' => $maths->id, 'ecole_id' => $school->id, 'note' => 18, 'note_sur' => 20]);
        Notes::factory()->create(['eleve_id' => $eleve->id, 'matiere_id' => $french->id, 'ecole_id' => $school->id, 'note' => 8, 'note_sur' => 20]);

        $response = $this->getJson('/api/notes/moyennes-par-matiere')->assertStatus(200);

        $rows = collect($response->json('data'));
        $this->assertCount(2, $rows);
        // Sorted by descending average.
        $this->assertEquals(18, $rows->first()['moyenne']);
        $this->assertSame($maths->id, $rows->first()['matiere_id']);
    }

    /* ─── Student coursework, from the lesson book ────────────────────── */

    /** @test */
    public function a_student_reads_the_lesson_book_of_their_own_class()
    {
        $school  = Ecole::factory()->create();
        $classe  = Classes::factory()->create(['ecole_id' => $school->id]);
        $eleve   = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);

        // La clé étrangère pointe vers `enseignants`, pas vers `users`.
        $teacher = Enseignant::factory()->forSchool($school)->create();

        CahierDeTexte::create([
            'classe_id'     => $classe->id,
            'matiere_id'    => $matiere->id,
            'enseignant_id' => $teacher->id,
            'ecole_id'      => $school->id,
            'date'        => now()->toDateString(),
            'titre_lecon' => 'Les fractions',
            'contenu'     => 'Addition et soustraction.',
        ]);

        $this->actingAs($eleve->user)
            ->getJson('/api/eleves/me/cours')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.data.0.titre', 'Les fractions');
    }

    /* ─── Messaging: routes that existed only as controller methods ───── */

    /** @test */
    public function the_conversation_list_is_reachable_and_scoped_to_the_caller()
    {
        $school = Ecole::factory()->create();
        $alice  = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);
        $bob    = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);

        $this->actingAs($alice)->postJson('/api/messages', [
            'destinataire' => (string) $bob->id,
            'contenu'      => 'Bonjour',
        ])->assertStatus(201);

        $this->actingAs($alice)
            ->getJson('/api/messages/conversations')
            ->assertStatus(200)
            ->assertJsonPath('data.0.contact_id', (string) $bob->id);

        $this->actingAs($bob)
            ->getJson('/api/messages/unread-count')
            ->assertStatus(200)
            ->assertJsonPath('count', 1);
    }

    /** @test */
    public function a_message_can_be_sent_without_a_subject()
    {
        $school = Ecole::factory()->create();
        $sender = User::factory()->create(['role' => 'eleve', 'ecole_id' => $school->id]);
        $target = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);

        // The chat UI has no subject field; the column is NOT NULL, so the API
        // falls back to a placeholder rather than rejecting the request.
        $this->actingAs($sender)->postJson('/api/messages', [
            'destinataire' => (string) $target->id,
            'contenu'      => 'Une question',
        ])->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'expediteur' => (string) $sender->id,
            'contenu'    => 'Une question',
            'sujet'      => '(sans objet)',
        ]);
    }

    /* ─── Periods, wired at last ──────────────────────────────────────── */

    /** @test */
    public function the_periods_endpoint_is_reachable()
    {
        $this->actingInSchool();

        $this->getJson('/api/periodes')->assertStatus(200);
    }
}
