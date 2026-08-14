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

        $mine     = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $notMine  = Eleve::factory()->forSchool($school)->create(['classe_id' => $other->id]);

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
            'classe_id'  => $pupil->classe_id,
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

        $pupil   = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
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

    /* ─── The exhaustive vocabulary (audit 2026-08-07) ────────────────── */

    /** @test */
    public function every_role_the_backend_gates_on_is_declared_in_roles()
    {
        $gates = ['eleve', 'parent', 'comptable', 'surveillant', 'censeur',
            'infirmier', 'bibliothecaire', 'secretaire', 'admin'];

        foreach ($gates as $gate) {
            $this->assertContains(
                $gate,
                Roles::all(),
                "Le rôle {$gate} est gaté dans les routes mais absent de Roles::all()"
            );
        }
    }

    /** @test */
    public function provisionable_covers_the_school_organigramme_but_not_the_platform()
    {
        $provisionable = Roles::provisionable();

        foreach (['admin', 'directeur', 'directeurM', 'directeurP', 'directeurS',
                'censeur', 'secretaire', 'comptable', 'surveillant',
                'infirmier', 'bibliothecaire', 'eleve', 'parent', 'enseignant'] as $role) {
            $this->assertContains($role, $provisionable);
        }

        // The truly platform roles are never assignable from a tenant context.
        $this->assertNotContains('super-admin', $provisionable);
        $this->assertNotContains('recteur', $provisionable);
        $this->assertNotContains('doyen', $provisionable);
        $this->assertNotContains('professeur', $provisionable);
        $this->assertNotContains('personnel', $provisionable);
        $this->assertNotContains('etudiant', $provisionable);
    }

    /** @test */
    public function a_cycle_teacher_reaches_a_teacher_gated_route()
    {
        $school = Ecole::factory()->create(['status' => 'active']);

        foreach (['enseignement', 'enseignementM', 'enseignementP'] as $role) {
            $teacherUser = User::factory()->create(['role' => $role, 'ecole_id' => $school->id]);
            Enseignant::factory()->create(['user_id' => $teacherUser->id, 'ecole_id' => $school->id]);

            $this->assertTrue(
                Roles::satisfies($role, ['enseignant']),
                "Le rôle {$role} devrait satisfaire la gate enseignant"
            );

            $this->actingAs($teacherUser)
                ->getJson('/api/dashboard/enseignant')
                ->assertStatus(200, "Le rôle {$role} devrait atteindre une route role:enseignant");
        }
    }

    /** @test */
    public function the_legacy_enseignant_pellet_vocabulary_is_rejected()
    {
        // `EnseignantController` validated `enseignantM`/`enseignantP`, which
        // exist in no family — an account created that way was locked out of
        // every teacher route (the directeurP lockout, replayed). The canonical
        // spellings are `enseignementM`/`enseignementP`.
        $this->assertNotContains('enseignantM', Roles::teachers());
        $this->assertNotContains('enseignantP', Roles::teachers());
    }

    /** @test */
    public function a_librarian_may_list_the_pupils_of_a_class()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $librarian = User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => $school->id]);

        $this->actingAs($librarian)
            ->getJson("/api/classes/{$classe->id}/eleves")
            ->assertStatus(200);
    }

    /* ─── Every provisioned role is reachable (lot L2) ────────────────── */

    /** @test */
    public function every_school_organigramme_role_can_sign_in_with_its_seeded_identity()
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

        $school = Ecole::factory()->create(['status' => 'active']);

        $roles = [
            'admin'           => ['admin', "admin'spassword1234567@"],
            'directeur'       => ['directeur', "director'spassword1234567@"],
            'directeurM'      => ['directeurM', "directorM'spassword1234567@"],
            'directeurP'      => ['directeurP', "directorP'spassword1234567@"],
            'directeurS'      => ['directeurS', "directorS'spassword1234567@"],
            'censeur'         => ['censeur', "censeur'spassword1234567@"],
            'secretaire'      => ['secretaire', "secretaire'spassword1234567@"],
            'comptable'       => ['comptable', "comptable'spassword1234567@"],
            'surveillant'     => ['surveillant', "surveillant'spassword1234567@"],
            'infirmier'       => ['infirmier', "infirmier'spassword1234567@"],
            'bibliothecaire'  => ['bibliothecaire', "bibliothecaire'spassword1234567@"],
            'enseignant'      => ['enseignant', "enseignant'spassword1234567@"],
        ];

        foreach ($roles as $role => [$identifiant, $password]) {
            User::factory()->create([
                'role'        => $role,
                'identifiant' => $identifiant . '_ecole' . $school->id,
                'email'       => $role . 'ecole' . $school->id . '@gmail.cj',
                'password'    => $password,
                'ecole_id'    => $school->id,
            ]);

            $this->postJson('/api/auth/login', [
                'identifiant' => $identifiant . '_ecole' . $school->id,
                'password'    => $password,
            ])->assertStatus(200, "Le compte {$role} devrait se connecter avec son identifiant");
        }
    }

    /** @test */
    public function every_university_role_can_sign_in_with_its_seeded_identity()
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

        $school = Ecole::factory()->create(['status' => 'active']);

        \App\Models\Universite\Universite::factory()->forSchool($school)->create();

        $accounts = [
            'recteur'     => 'recteur@uac.bj',
            'doyen'       => 'doyen1@uac.bj',
            'professeur'  => 'vincent.kodjogbe@uac.bj',
            'personnel'   => 'marcellin.bossou@uac.bj',
            'etudiant'    => 'kossi.adjovi@etu.uac.bj',
        ];

        foreach ($accounts as $role => $email) {
            User::factory()->create([
                'role'     => $role,
                'email'    => $email,
                'password' => 'password1234',
                'ecole_id' => $school->id,
            ]);

            $this->postJson('/api/auth/login', [
                'email' => $email, 'password' => 'password1234',
            ])->assertStatus(200, "Le compte {$role} devrait se connecter avec son email");
        }
    }
}
