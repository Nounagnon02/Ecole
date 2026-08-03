<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use App\Support\Roles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Cycle heads, and the authorship checks that never matched.
 *
 * `SchoolProvision` creates a `directeurM`, `directeurP` and `directeurS`
 * account for every school. Not one route named those roles — all 87
 * director-gated routes read `role:directeur` — so the three accounts were
 * provisioned, given a password, and refused by every endpoint and every
 * policy.
 *
 * Two policy checks were also structurally unable to pass:
 *   - `ElevePolicy` and `AbsencePolicy` filtered on `eleves.classe_id`, a column
 *     that does not exist, so no teacher could ever see a pupil;
 *   - `NotePolicy` read `$note->enseignant_id`, also absent — the author column
 *     is `created_by` — so no teacher could see a mark they had just entered.
 */
class RoleFamilyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Put a teacher in front of a class.
     *
     * `Enseignant::classes()` is a belongsToMany over `enseignant_matiere`, so
     * the link is really teacher–subject–class and needs a subject.
     */
    private function assignClass(Enseignant $teacher, Classes $classe, Ecole $school): void
    {
        $serieId = DB::table('series')->insertGetId([
            'nom'        => 'Serie test',
            'ecole_id'   => $school->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $teacher->classes()->attach($classe->id, [
            'matiere_id' => Matieres::factory()->create(['ecole_id' => $school->id])->id,
            'serie_id'   => $serieId,
            'ecole_id'   => $school->id,
        ]);
    }

    /* ─── The vocabulary itself ───────────────────────────────────────── */

    /** @test */
    public function gating_on_director_admits_the_cycle_heads()
    {
        $expanded = Roles::expand(['directeur']);

        $this->assertContains('directeurM', $expanded);
        $this->assertContains('directeurP', $expanded);
        $this->assertContains('directeurS', $expanded);
        $this->assertContains('directeur', $expanded);
    }

    /** @test */
    public function expanding_is_idempotent_and_does_not_widen_other_roles()
    {
        $once  = Roles::expand(['directeur', 'comptable']);
        $twice = Roles::expand($once);

        $this->assertEqualsCanonicalizing($once, $twice);

        // A cycle head is not an accountant, and gating on `comptable` must not
        // pull in anything else.
        $this->assertSame(['comptable'], Roles::expand(['comptable']));
    }

    /** @test */
    public function a_cycle_head_is_a_director_but_not_a_platform_super_admin()
    {
        $this->assertTrue(Roles::isDirector('directeurP'));
        $this->assertTrue(Roles::isDirector('directeur'));
        $this->assertFalse(Roles::isDirector('super-admin'));
        $this->assertFalse(Roles::isDirector('comptable'));
        $this->assertFalse(Roles::isDirector(null));
    }

    /** @test */
    public function each_cycle_head_maps_to_its_cycle()
    {
        $this->assertSame('Maternelle', Roles::cycleOf('directeurM'));
        $this->assertSame('Primaire', Roles::cycleOf('directeurP'));
        $this->assertSame('Secondaire', Roles::cycleOf('directeurS'));
        // The general head spans the whole school.
        $this->assertNull(Roles::cycleOf('directeur'));
    }

    /* ─── The middleware ──────────────────────────────────────────────── */

    /** @test */
    public function a_cycle_head_reaches_a_director_gated_route()
    {
        $school = Ecole::factory()->create(['status' => 'active']);

        foreach (['directeurM', 'directeurP', 'directeurS'] as $role) {
            $head = User::factory()->create(['role' => $role, 'ecole_id' => $school->id]);

            $this->actingAs($head)
                ->getJson('/api/classes')
                ->assertStatus(200, "Le rôle {$role} devrait atteindre une route role:directeur");
        }
    }

    /** @test */
    public function widening_director_does_not_widen_the_other_gates()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $head   = User::factory()->create(['role' => 'directeurP', 'ecole_id' => $school->id]);

        // Still not a librarian, an accountant or a platform admin: the family
        // only covers heads of school (cf. audit S1). `/api/infirmier/...` is
        // gated `role:directeur,infirmier`, so a head is legitimately allowed
        // there — these two gates name no director at all.
        $this->actingAs($head)->getJson('/api/dashboard/comptable')->assertStatus(403);
        $this->actingAs($head)->getJson('/api/dashboard/bibliothecaire')->assertStatus(403);
        $this->actingAs($head)->getJson('/api/admin/utilisateurs')->assertStatus(403);
    }

    /* ─── The policies ────────────────────────────────────────────────── */

    /** @test */
    public function a_cycle_head_passes_the_pupil_policy()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $head   = User::factory()->create(['role' => 'directeurS', 'ecole_id' => $school->id]);
        $pupil  = Eleve::factory()->forSchool($school)->create();

        $this->assertTrue($head->can('view', $pupil));
        $this->assertTrue($head->can('update', $pupil));
        $this->assertTrue($head->can('delete', $pupil));
    }

    /** @test */
    public function a_teacher_can_view_a_pupil_of_their_own_class()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $other  = Classes::factory()->create(['ecole_id' => $school->id]);

        $teacherUser = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);
        $teacher     = Enseignant::factory()->create([
            'user_id'  => $teacherUser->id,
            'ecole_id' => $school->id,
        ]);
        $this->assignClass($teacher, $classe, $school);

        $mine     = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $notMine  = Eleve::factory()->forSchool($school)->create(['class_id' => $other->id]);

        // `Enseignant` carries BelongsToEcole, whose scope fails closed with no
        // authenticated user — so the policy must be evaluated inside a session.
        $this->actingAs($teacherUser);

        // Used to be false for everyone: the filter read `classe_id`.
        $this->assertTrue($teacherUser->fresh()->can('view', $mine));
        $this->assertFalse($teacherUser->fresh()->can('view', $notMine));
    }

    /** @test */
    public function a_teacher_can_view_and_amend_a_mark_they_entered()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $pupil  = Eleve::factory()->forSchool($school)->create();

        $author = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);
        $others = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);
        Enseignant::factory()->create(['user_id' => $author->id, 'ecole_id' => $school->id]);
        Enseignant::factory()->create(['user_id' => $others->id, 'ecole_id' => $school->id]);

        $mark = Notes::factory()->create([
            'eleve_id'   => $pupil->id,
            'classe_id'  => $pupil->class_id,
            'ecole_id'   => $school->id,
            'created_by' => $author->id,
        ]);

        $this->actingAs($author);

        // Both were false before: the check read a column that does not exist.
        $this->assertTrue($author->fresh()->can('view', $mark));
        $this->assertTrue($author->fresh()->can('update', $mark));

        // And a colleague still cannot touch it.
        $this->assertFalse($others->fresh()->can('view', $mark));
        $this->assertFalse($others->fresh()->can('update', $mark));
    }

    /** @test */
    public function an_absence_whose_pupil_is_gone_is_refused_not_fatal()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $teacherUser = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $school->id]);
        $teacher     = Enseignant::factory()->create([
            'user_id'  => $teacherUser->id,
            'ecole_id' => $school->id,
        ]);
        $this->assignClass($teacher, $classe, $school);

        $pupil   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $absence = Absence::factory()->create([
            'eleve_id' => $pupil->id,
            'ecole_id' => $school->id,
        ]);

        $this->actingAs($teacherUser);

        $this->assertTrue($teacherUser->fresh()->can('view', $absence));

        // A dangling absence must deny, not raise on a null pupil.
        $absence->setRelation('eleve', null);
        $this->assertFalse($teacherUser->fresh()->can('view', $absence));
    }
}
