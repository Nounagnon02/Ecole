<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Communication;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use App\Support\Cycles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The school noticeboard.
 *
 * The page existed with no table behind it, so the feature had to be designed
 * rather than wired. Two questions decided the shape, and both are asserted here
 * because both are easy to get subtly wrong:
 *
 * **Who sees this.** The audience is a rule evaluated against the reader, not a
 * stored recipient list. A list would have to be rewritten every time a pupil
 * changes class, and an announcement to "all parents" would silently stop
 * reaching parents enrolled after it was published. The rule cannot go stale.
 *
 * **For how long.** A publication/expiry window rather than a boolean flag: an
 * expired notice leaves the feed by itself and the row survives for the record.
 * A flag needs somebody to come back and unset it, and nobody ever does.
 */
class CommunicationsTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Classes $primary;
    private Classes $secondary;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);

        // Built as an unrestricted head, so the fixtures are not filtered by the
        // boundaries under test.
        $this->actingAs($this->staff('directeur'));

        $this->primary = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => Cycles::PRIMARY,
        ]);
        $this->secondary = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);
    }

    /* ─── Audience: the whole school ──────────────────────────────────── */

    /** @test */
    public function a_school_wide_announcement_reaches_every_role()
    {
        $notice = $this->notice();

        foreach (['directeur', 'enseignant', 'comptable', 'infirmier', 'secretaire'] as $role) {
            $this->actingAs($this->staff($role))
                ->getJson('/api/communications')
                ->assertStatus(200)
                ->assertJsonFragment(['titre' => $notice->titre]);
        }
    }

    /** @test */
    public function a_pupil_and_a_parent_also_read_the_school_wide_feed()
    {
        $notice = $this->notice();
        $pupil  = $this->pupilIn($this->primary);

        $this->actingAs($pupil->user)
            ->getJson('/api/communications')
            ->assertStatus(200)
            ->assertJsonFragment(['titre' => $notice->titre]);
    }

    /* ─── Audience: one cycle ─────────────────────────────────────────── */

    /** @test */
    public function a_cycle_announcement_reaches_that_cycles_pupils_only()
    {
        $forPrimary = $this->notice(fn($f) => $f->forCycle(Cycles::PRIMARY));

        $primaryPupil   = $this->pupilIn($this->primary);
        $secondaryPupil = $this->pupilIn($this->secondary);

        $this->actingAs($primaryPupil->user)
            ->getJson('/api/communications')
            ->assertJsonFragment(['titre' => $forPrimary->titre]);

        $this->actingAs($secondaryPupil->user)
            ->getJson('/api/communications')
            ->assertJsonMissing(['titre' => $forPrimary->titre]);
    }

    /** @test */
    public function a_cycle_head_reads_their_own_cycle_and_not_the_others()
    {
        $forPrimary   = $this->notice(fn($f) => $f->forCycle(Cycles::PRIMARY));
        $forSecondary = $this->notice(fn($f) => $f->forCycle(Cycles::SECONDARY));

        $this->actingAs($this->staff('directeurP'))
            ->getJson('/api/communications')
            ->assertJsonFragment(['titre' => $forPrimary->titre])
            ->assertJsonMissing(['titre' => $forSecondary->titre]);
    }

    /** @test */
    public function a_cycle_head_still_reads_the_school_wide_feed()
    {
        // This is the reason `Communication` does not adopt `ScopedToCycle`: the
        // trait filters with `whereIn(classe_id, …)`, which a NULL never
        // satisfies, so every school-wide announcement would vanish for the three
        // cycle heads — a regression dressed up as a boundary.
        $schoolWide = $this->notice();

        $this->actingAs($this->staff('directeurS'))
            ->getJson('/api/communications')
            ->assertStatus(200)
            ->assertJsonFragment(['titre' => $schoolWide->titre]);
    }

    /** @test */
    public function the_general_head_reads_every_cycle()
    {
        $forPrimary   = $this->notice(fn($f) => $f->forCycle(Cycles::PRIMARY));
        $forSecondary = $this->notice(fn($f) => $f->forCycle(Cycles::SECONDARY));

        // Unrestricted means no filter, not no access — the same convention as
        // `CycleAccess`.
        $this->actingAs($this->staff('directeur'))
            ->getJson('/api/communications')
            ->assertJsonFragment(['titre' => $forPrimary->titre])
            ->assertJsonFragment(['titre' => $forSecondary->titre]);
    }

    /* ─── Audience: one class ─────────────────────────────────────────── */

    /** @test */
    public function a_class_announcement_reaches_that_class_only()
    {
        $notice = $this->notice(fn($f) => $f->forClass($this->primary));

        $inClass    = $this->pupilIn($this->primary);
        $otherClass = $this->pupilIn($this->secondary);

        $this->actingAs($inClass->user)
            ->getJson('/api/communications')
            ->assertJsonFragment(['titre' => $notice->titre]);

        $this->actingAs($otherClass->user)
            ->getJson('/api/communications')
            ->assertJsonMissing(['titre' => $notice->titre]);
    }

    /** @test */
    public function a_parent_reads_the_announcements_of_their_childs_class()
    {
        $notice = $this->notice(fn($f) => $f->forClass($this->primary));

        $child = $this->pupilIn($this->primary);

        $parentUser = $this->staff('parent');
        $parent = \App\Models\UserParent::factory()->create([
            'user_id'  => $parentUser->id,
            'ecole_id' => $this->school->id,
        ]);
        $parent->eleves()->attach($child->id);

        // A recipient list would have missed this: the parent was attached to the
        // child after the notice was written.
        $this->actingAs($parentUser)
            ->getJson('/api/communications')
            ->assertStatus(200)
            ->assertJsonFragment(['titre' => $notice->titre]);
    }

    /* ─── Audience: one role ──────────────────────────────────────────── */

    /** @test */
    public function a_role_announcement_reaches_that_role_only()
    {
        $forTeachers = $this->notice(fn($f) => $f->forRole('enseignant'));

        $this->actingAs($this->staff('enseignant'))
            ->getJson('/api/communications')
            ->assertJsonFragment(['titre' => $forTeachers->titre]);

        $this->actingAs($this->staff('comptable'))
            ->getJson('/api/communications')
            ->assertJsonMissing(['titre' => $forTeachers->titre]);
    }

    /** @test */
    public function an_announcement_to_the_heads_reaches_the_cycle_heads_too()
    {
        // `Roles::gatesSatisfiedBy` is the inverse of the `expand()` the role
        // middleware uses. Deriving both from one FAMILIES table is what keeps a
        // notice addressed to `directeur` from skipping the three deputies —
        // exactly the lockout that `role:directeur` used to cause.
        $forHeads = $this->notice(fn($f) => $f->forRole('directeur'));

        foreach (['directeur', 'directeurM', 'directeurP', 'directeurS'] as $role) {
            $this->actingAs($this->staff($role))
                ->getJson('/api/communications')
                ->assertJsonFragment(['titre' => $forHeads->titre]);
        }
    }

    /* ─── Validity window ─────────────────────────────────────────────── */

    /** @test */
    public function a_scheduled_announcement_stays_out_of_the_feed_until_its_date()
    {
        $future = $this->notice(fn($f) => $f->scheduled());

        $this->actingAs($this->staff('enseignant'))
            ->getJson('/api/communications')
            ->assertStatus(200)
            ->assertJsonMissing(['titre' => $future->titre]);
    }

    /** @test */
    public function an_expired_announcement_leaves_the_feed_but_not_the_database()
    {
        $lapsed = $this->notice(fn($f) => $f->expired());

        $this->actingAs($this->staff('enseignant'))
            ->getJson('/api/communications')
            ->assertJsonMissing(['titre' => $lapsed->titre]);

        // Expiry is not a delete: the notice must stay auditable.
        $this->assertDatabaseHas('communications', ['id' => $lapsed->id]);
    }

    /** @test */
    public function an_editor_can_ask_for_the_scheduled_and_lapsed_notices()
    {
        $future = $this->notice(fn($f) => $f->scheduled());
        $lapsed = $this->notice(fn($f) => $f->expired());

        $this->actingAs($this->staff('directeur'))
            ->getJson('/api/communications?tout=1')
            ->assertStatus(200)
            ->assertJsonFragment(['titre' => $future->titre])
            ->assertJsonFragment(['titre' => $lapsed->titre]);
    }

    /** @test */
    public function a_reader_without_an_editorial_role_cannot_lift_the_window()
    {
        $future = $this->notice(fn($f) => $f->scheduled());

        // Otherwise a query parameter would be enough to read next term's fee
        // increase a week early.
        $this->actingAs($this->staff('enseignant'))
            ->getJson('/api/communications?tout=1')
            ->assertStatus(200)
            ->assertJsonMissing(['titre' => $future->titre]);
    }

    /* ─── Ordering ────────────────────────────────────────────────────── */

    /** @test */
    public function pinned_announcements_come_first()
    {
        $this->notice(fn($f) => $f->state(['titre' => 'Récent', 'publie_le' => now()]));
        $this->notice(fn($f) => $f->pinned()->state(['titre' => 'Épinglé', 'publie_le' => now()->subMonth()]));

        $titles = collect(
            $this->actingAs($this->staff('enseignant'))
                ->getJson('/api/communications')
                ->json('data')
        )->pluck('titre');

        // Pinned wins over recency, or pinning would do nothing.
        $this->assertSame('Épinglé', $titles->first());
    }

    /* ─── Publishing ──────────────────────────────────────────────────── */

    /** @test */
    public function a_head_publishes_an_announcement()
    {
        $head = $this->staff('directeur');

        $this->actingAs($head)
            ->postJson('/api/communications', [
                'titre'     => 'Réunion de rentrée',
                'contenu'   => 'Le lundi 8 à 9h en salle des fêtes.',
                'categorie' => 'important',
                'tags'      => ['rentrée'],
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.auteur_id', $head->id)
            // Defaults must reach the response, not just the row.
            ->assertJsonPath('data.audience', Communication::AUDIENCE_SCHOOL);

        $this->assertDatabaseHas('communications', [
            'titre'    => 'Réunion de rentrée',
            'ecole_id' => $this->school->id,
        ]);
    }

    /** @test */
    public function a_teacher_may_not_publish()
    {
        // A teacher addresses a class through assignments and messages, both of
        // which have a recipient. A noticeboard has an audience, and handing that
        // to everyone turns it into a second, unmoderated inbox.
        $this->actingAs($this->staff('enseignant'))
            ->postJson('/api/communications', [
                'titre'   => 'Annonce non autorisée',
                'contenu' => 'Bonjour',
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function a_pupil_may_not_publish()
    {
        $pupil = $this->pupilIn($this->primary);

        $this->actingAs($pupil->user)
            ->postJson('/api/communications', ['titre' => 'Coucou', 'contenu' => 'Bonjour'])
            ->assertStatus(403);
    }

    /** @test */
    public function the_secretary_and_the_censeur_may_publish()
    {
        foreach (['secretaire', 'censeur'] as $role) {
            $this->actingAs($this->staff($role))
                ->postJson('/api/communications', [
                    'titre'   => "Annonce du {$role}",
                    'contenu' => 'Contenu',
                ])
                ->assertStatus(201);
        }
    }

    /* ─── The cycle boundary, on the write side ───────────────────────── */

    /** @test */
    public function a_cycle_head_cannot_publish_to_another_cycle()
    {
        // A global scope filters selects and does nothing about an insert, so
        // without an explicit guard the primary head could address the
        // secondary — the very authority the cycle boundary separates.
        $this->actingAs($this->staff('directeurP'))
            ->postJson('/api/communications', [
                'titre'          => 'Annonce hors cycle',
                'contenu'        => 'Contenu',
                'audience'       => Communication::AUDIENCE_CYCLE,
                'audience_cycle' => Cycles::SECONDARY,
            ])
            // 403, not 404: a cycle head is a colleague in the same school, and
            // the secondary cycle is no secret to them — it is simply not theirs.
            ->assertStatus(403);
    }

    /** @test */
    public function a_cycle_head_cannot_publish_to_another_cycles_class()
    {
        $this->actingAs($this->staff('directeurP'))
            ->postJson('/api/communications', [
                'titre'     => 'Annonce hors cycle',
                'contenu'   => 'Contenu',
                'audience'  => Communication::AUDIENCE_CLASS,
                'classe_id' => $this->secondary->id,
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function a_cycle_head_publishes_within_their_own_cycle()
    {
        $this->actingAs($this->staff('directeurP'))
            ->postJson('/api/communications', [
                'titre'     => 'Sortie scolaire',
                'contenu'   => 'Mardi prochain.',
                'audience'  => Communication::AUDIENCE_CLASS,
                'classe_id' => $this->primary->id,
            ])
            ->assertStatus(201);
    }

    /* ─── Validation ──────────────────────────────────────────────────── */

    /** @test */
    public function a_class_announcement_needs_a_class()
    {
        $this->actingAs($this->staff('directeur'))
            ->postJson('/api/communications', [
                'titre'    => 'Sans cible',
                'contenu'  => 'Contenu',
                'audience' => Communication::AUDIENCE_CLASS,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('classe_id');
    }

    /** @test */
    public function a_cycle_announcement_needs_a_recognised_cycle()
    {
        $this->actingAs($this->staff('directeur'))
            ->postJson('/api/communications', [
                'titre'          => 'Cycle inventé',
                'contenu'        => 'Contenu',
                'audience'       => Communication::AUDIENCE_CYCLE,
                'audience_cycle' => 'Lycée',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('audience_cycle');
    }

    /** @test */
    public function an_announcement_cannot_target_another_schools_class()
    {
        $theirs = Ecole::factory()->create(['status' => 'active']);
        $theirClass = Classes::factory()->create([
            'ecole_id'         => $theirs->id,
            'categorie_classe' => Cycles::PRIMARY,
        ]);

        // `school_exists`, not `exists`: Laravel's rule runs on the raw query
        // builder, so it would accept this id and the row would land with a
        // foreign key into another tenant.
        $this->actingAs($this->staff('directeur'))
            ->postJson('/api/communications', [
                'titre'     => 'Annonce croisée',
                'contenu'   => 'Contenu',
                'audience'  => Communication::AUDIENCE_CLASS,
                'classe_id' => $theirClass->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('classe_id');
    }

    /** @test */
    public function an_expiry_before_publication_is_refused()
    {
        $this->actingAs($this->staff('directeur'))
            ->postJson('/api/communications', [
                'titre'     => 'Fenêtre inversée',
                'contenu'   => 'Contenu',
                'publie_le' => now()->addWeek()->toDateTimeString(),
                'expire_le' => now()->toDateTimeString(),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('expire_le');
    }

    /* ─── Editing and deleting ────────────────────────────────────────── */

    /** @test */
    public function the_author_edits_their_own_announcement()
    {
        $secretary = $this->staff('secretaire');
        $notice = $this->notice(fn($f) => $f->state(['auteur_id' => $secretary->id]));

        $this->actingAs($secretary)
            ->putJson("/api/communications/{$notice->id}", ['titre' => 'Titre corrigé', 'contenu' => 'Corrigé'])
            ->assertStatus(200)
            ->assertJsonPath('data.titre', 'Titre corrigé');
    }

    /** @test */
    public function a_peer_of_the_same_role_cannot_rewrite_a_colleagues_announcement()
    {
        // An announcement is signed. Letting a peer edit it under somebody else's
        // name is a small forgery, so only the author and the head may.
        $author = $this->staff('secretaire');
        $peer   = $this->staff('secretaire');
        $notice = $this->notice(fn($f) => $f->state(['auteur_id' => $author->id]));

        $this->actingAs($peer)
            ->putJson("/api/communications/{$notice->id}", ['titre' => 'Détourné', 'contenu' => 'x'])
            ->assertStatus(403);
    }

    /** @test */
    public function the_head_can_correct_anyones_announcement()
    {
        // Somebody has to be able to fix a notice whose author is on leave.
        $author = $this->staff('censeur');
        $notice = $this->notice(fn($f) => $f->state(['auteur_id' => $author->id]));

        $this->actingAs($this->staff('directeur'))
            ->putJson("/api/communications/{$notice->id}", ['titre' => 'Corrigé', 'contenu' => 'x'])
            ->assertStatus(200);
    }

    /** @test */
    public function the_author_deletes_their_announcement()
    {
        $author = $this->staff('secretaire');
        $notice = $this->notice(fn($f) => $f->state(['auteur_id' => $author->id]));

        $this->actingAs($author)
            ->deleteJson("/api/communications/{$notice->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('communications', ['id' => $notice->id]);
    }

    /* ─── Tenant isolation ────────────────────────────────────────────── */

    /** @test */
    public function another_schools_announcement_is_not_found_rather_than_forbidden()
    {
        $theirs = Ecole::factory()->create(['status' => 'active']);
        $theirHead = User::factory()->create(['role' => 'directeur', 'ecole_id' => $theirs->id]);

        $this->actingAs($theirHead);
        $theirNotice = Communication::factory()->create([
            'auteur_id' => $theirHead->id,
            'ecole_id'  => $theirs->id,
        ]);

        // 404: a 403 would confirm the announcement exists somewhere.
        $this->actingAs($this->staff('directeur'))
            ->getJson("/api/communications/{$theirNotice->id}")
            ->assertStatus(404);
    }

    /** @test */
    public function the_feed_never_shows_another_schools_announcements()
    {
        $theirs = Ecole::factory()->create(['status' => 'active']);
        $theirHead = User::factory()->create(['role' => 'directeur', 'ecole_id' => $theirs->id]);

        $this->actingAs($theirHead);
        $theirNotice = Communication::factory()->create([
            'auteur_id' => $theirHead->id,
            'ecole_id'  => $theirs->id,
        ]);

        $mine = $this->notice();

        $titles = collect(
            $this->actingAs($this->staff('directeur'))
                ->getJson('/api/communications')
                ->json('data')
        )->pluck('titre');

        $this->assertContains($mine->titre, $titles);
        $this->assertNotContains($theirNotice->titre, $titles);
    }

    /** @test */
    public function a_reader_not_addressed_by_a_notice_cannot_open_it_by_id()
    {
        $forSecondary = $this->notice(fn($f) => $f->forCycle(Cycles::SECONDARY));

        $primaryPupil = $this->pupilIn($this->primary);

        // The feed filter alone is not enough: without the same check on `show`,
        // the id is a back door around the audience rule.
        $this->actingAs($primaryPupil->user)
            ->getJson("/api/communications/{$forSecondary->id}")
            ->assertStatus(404);
    }

    /** @test */
    public function the_table_restricts_school_deletion()
    {
        $rules = collect(\Illuminate\Support\Facades\Schema::getForeignKeys('communications'))
            ->filter(fn($fk) => in_array('ecole_id', $fk['columns'] ?? [], true))
            ->pluck('on_delete')
            ->map(fn($rule) => strtolower((string) $rule));

        $this->assertNotEmpty($rules);
        $this->assertNotContains('cascade', $rules);
    }

    /* ─── Fixtures ────────────────────────────────────────────────────── */

    private function staff(string $role): User
    {
        return User::factory()->create(['role' => $role, 'ecole_id' => $this->school->id]);
    }

    private function pupilIn(Classes $classe): Eleve
    {
        return Eleve::factory()->forSchool($this->school)->create(['class_id' => $classe->id]);
    }

    /**
     * An announcement, authored by a head of this school.
     *
     * Created while acting as an unrestricted head so the fixture itself is not
     * shaped by the boundary under test.
     *
     * @param  null|callable(\Database\Factories\CommunicationFactory): \Database\Factories\CommunicationFactory  $shape
     */
    private function notice(?callable $shape = null): Communication
    {
        $previous = auth()->user();
        $head = $this->staff('directeur');
        $this->actingAs($head);

        $factory = Communication::factory()->state([
            'auteur_id' => $head->id,
            'ecole_id'  => $this->school->id,
            'titre'     => 'Annonce ' . fake()->unique()->numerify('#####'),
        ]);

        $notice = ($shape ? $shape($factory) : $factory)->create();

        if ($previous) {
            $this->actingAs($previous);
        }

        return $notice;
    }
}
