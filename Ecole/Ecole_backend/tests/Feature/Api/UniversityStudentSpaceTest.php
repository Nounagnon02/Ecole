<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Universite\Devoir;
use App\Models\Universite\EmploiDuTemps;
use App\Models\Universite\Enseignant;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Filiere;
use App\Models\Universite\Matiere;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The university personal space.
 *
 * Three of the four pages neutralised in `ECARTS_FRONT_BACK.md` §4 lived here,
 * and all three were blocked by the same missing column. `etudiants` carried no
 * `user_id`, so a signed-in account could not be resolved to a student record.
 * Every scholastic profile has that link — `eleves.user_id`, `parents.user_id`,
 * `enseignants.user_id` — and the whole personal side of the app is built on it.
 * Without it "my courses", "my timetable" and "my assignments" are not features
 * that were forgotten; they are questions the server had no way to answer.
 *
 * These tests fix the link, and then fix what matters more than the link: that
 * the answer is *narrowed* by it. An endpoint that resolves the caller and then
 * returns everybody's data is worse than no endpoint, because it looks correct.
 */
class UniversityStudentSpaceTest extends TestCase
{
    use RefreshDatabase;

    /* ─── The link itself ─────────────────────────────────────────────── */

    /** @test */
    public function a_student_record_carries_a_user_id_and_resolves_both_ways()
    {
        $this->assertTrue(
            Schema::hasColumn('etudiants', 'user_id'),
            'etudiants.user_id manque : tout l\'espace étudiant en dépend'
        );
        $this->assertTrue(
            Schema::hasColumn('uni_enseignants', 'user_id'),
            'uni_enseignants.user_id manque : « mes cours » ne peut pas résoudre l\'enseignant'
        );

        $school  = $this->actingInSchool(role: 'recteur');
        $account = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $school->id]);
        $student = Etudiant::factory()->forUser($account)->create();

        $this->assertSame($student->id, $account->fresh()->etudiant->id);
        $this->assertSame($account->id, $student->fresh()->user->id);
    }

    /** @test */
    public function one_account_cannot_be_two_students()
    {
        $school  = $this->actingInSchool(role: 'recteur');
        $account = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $school->id]);

        Etudiant::factory()->forUser($account)->create();

        // A second record on the same account would make `User::etudiant()`
        // ambiguous, and "my courses" would answer differently depending on row
        // order.
        $this->expectException(\Illuminate\Database\QueryException::class);
        Etudiant::factory()->forUser($account)->create();
    }

    /** @test */
    public function unlinked_student_records_stay_allowed()
    {
        // Enrolment happens at the registrar's desk; credentials come later.
        // Several records without an account must coexist, which is why the
        // unique index sits on a nullable column.
        $this->actingInSchool(role: 'recteur');

        Etudiant::factory()->count(3)->create();

        $this->assertSame(3, Etudiant::whereNull('user_id')->count());
    }

    /* ─── GET /universite/mes-cours ───────────────────────────────────── */

    /** @test */
    public function a_student_sees_the_subjects_of_their_own_filiere_only()
    {
        ['student' => $student, 'subject' => $subject, 'other' => $other] = $this->campus();

        $response = $this->actingAs($student->user)
            ->getJson('/api/universite/mes-cours')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.profil', 'etudiant');

        $codes = collect($response->json('data'))->pluck('code');

        $this->assertContains($subject->code, $codes);
        $this->assertNotContains($other->code, $codes, 'Une autre filière ne doit pas apparaître');
    }

    /** @test */
    public function a_lecturer_sees_the_subjects_they_teach()
    {
        ['subject' => $subject, 'other' => $other, 'lecturer' => $lecturer] = $this->campus();

        $response = $this->actingAs($lecturer->user)
            ->getJson('/api/universite/mes-cours')
            ->assertStatus(200)
            ->assertJsonPath('meta.profil', 'enseignant');

        $codes = collect($response->json('data'))->pluck('code');

        $this->assertContains($subject->code, $codes);
        $this->assertNotContains($other->code, $codes, 'Une matière d\'un collègue ne doit pas apparaître');
    }

    /** @test */
    public function an_account_with_no_university_profile_gets_a_404_not_an_empty_list()
    {
        $school = $this->actingInSchool(role: 'recteur');

        $orphan = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $school->id]);

        // An empty list would read as "you have no courses", which is a lie: the
        // account simply is not attached to a record.
        $this->actingAs($orphan)
            ->getJson('/api/universite/mes-cours')
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function course_progress_is_derived_from_the_calendar()
    {
        ['student' => $student, 'subject' => $subject] = $this->campus();

        // Three sessions, one already held → 33%. A stored percentage would
        // drift the moment a fourth session is added.
        EmploiDuTemps::factory()->done()->create(['matiere_id' => $subject->id]);
        EmploiDuTemps::factory()->count(2)->create(['matiere_id' => $subject->id]);

        $response = $this->actingAs($student->user)
            ->getJson('/api/universite/mes-cours')
            ->assertStatus(200);

        $course = collect($response->json('data'))->firstWhere('code', $subject->code);

        $this->assertSame(3, $course['seances']);
        $this->assertSame(1, $course['seances_faites']);
        $this->assertSame(33, $course['progression']);
        $this->assertSame('en_cours', $course['statut']);
    }

    /** @test */
    public function a_course_whose_sessions_are_all_held_reads_as_finished()
    {
        ['student' => $student, 'subject' => $subject] = $this->campus();

        EmploiDuTemps::factory()->done()->count(2)->create(['matiere_id' => $subject->id]);

        $response = $this->actingAs($student->user)->getJson('/api/universite/mes-cours');
        $course   = collect($response->json('data'))->firstWhere('code', $subject->code);

        $this->assertSame(100, $course['progression']);
        $this->assertSame('termine', $course['statut']);
    }

    /** @test */
    public function a_course_with_no_calendar_yet_is_not_reported_as_finished()
    {
        // 0 sessions out of 0 is not 100% done. Reporting "terminé" for a course
        // nobody has scheduled would be the most misleading answer available.
        ['student' => $student, 'subject' => $subject] = $this->campus();

        $response = $this->actingAs($student->user)->getJson('/api/universite/mes-cours');
        $course   = collect($response->json('data'))->firstWhere('code', $subject->code);

        $this->assertSame(0, $course['progression']);
        $this->assertSame('en_cours', $course['statut']);
    }

    /** @test */
    public function the_head_count_never_reaches_into_another_school()
    {
        $mine = Ecole::factory()->create(['status' => 'active']);
        ['student' => $student, 'subject' => $subject, 'filiere' => $filiere] = $this->campus($mine);

        // Same filière id space, other establishment: a raw `DB::table` count
        // would add these in.
        $theirs = Ecole::factory()->create(['status' => 'active']);
        $this->actingAs(User::factory()->create(['role' => 'recteur', 'ecole_id' => $theirs->id]));
        Etudiant::factory()->count(4)->create();

        $response = $this->actingAs($student->user)->getJson('/api/universite/mes-cours');
        $course   = collect($response->json('data'))->firstWhere('code', $subject->code);

        $this->assertSame(
            Etudiant::where('filiere_id', $filiere->id)->count(),
            $course['etudiants']
        );
    }

    /* ─── GET /universite/planning ────────────────────────────────────── */

    /** @test */
    public function a_student_sees_their_filieres_sessions_and_the_campus_wide_ones()
    {
        ['student' => $student, 'filiere' => $filiere, 'otherFiliere' => $otherFiliere] = $this->campus();

        $mine     = EmploiDuTemps::factory()->create(['filiere_id' => $filiere->id, 'titre' => 'Mon cours']);
        $campus   = EmploiDuTemps::factory()->create(['filiere_id' => null, 'titre' => 'Rentrée solennelle']);
        $theirs   = EmploiDuTemps::factory()->create(['filiere_id' => $otherFiliere->id, 'titre' => 'Cours voisin']);

        $titles = collect(
            $this->actingAs($student->user)
                ->getJson('/api/universite/planning')
                ->assertStatus(200)
                ->json('data')
        )->pluck('titre');

        $this->assertContains($mine->titre, $titles);
        // A NULL filiere_id means "concerns everybody" and must not be filtered
        // out — that is the whole reason `forFiliere` keeps the NULL branch.
        $this->assertContains($campus->titre, $titles);
        $this->assertNotContains($theirs->titre, $titles);
    }

    /** @test */
    public function staff_see_the_whole_calendar()
    {
        ['school' => $school, 'otherFiliere' => $otherFiliere] = $this->campus();

        $session = EmploiDuTemps::factory()->create(['filiere_id' => $otherFiliere->id]);

        $dean = User::factory()->create(['role' => 'doyen', 'ecole_id' => $school->id]);

        $this->actingAs($dean)
            ->getJson('/api/universite/planning')
            ->assertStatus(200)
            ->assertJsonFragment(['titre' => $session->titre]);
    }

    /** @test */
    public function a_student_cannot_open_another_filieres_session()
    {
        ['student' => $student, 'otherFiliere' => $otherFiliere] = $this->campus();

        $theirs = EmploiDuTemps::factory()->create(['filiere_id' => $otherFiliere->id]);

        // 404 rather than 403: a 403 would confirm the session exists and let a
        // student enumerate another filière's exam calendar by id.
        $this->actingAs($student->user)
            ->getJson("/api/universite/planning/{$theirs->id}")
            ->assertStatus(404);
    }

    /** @test */
    public function a_session_from_another_school_is_not_found_rather_than_forbidden()
    {
        $mine = Ecole::factory()->create(['status' => 'active']);
        ['school' => $school] = $this->campus($mine);

        $theirs = Ecole::factory()->create(['status' => 'active']);
        $this->actingAs(User::factory()->create(['role' => 'recteur', 'ecole_id' => $theirs->id]));
        $theirSession = EmploiDuTemps::factory()->create();

        $dean = User::factory()->create(['role' => 'doyen', 'ecole_id' => $school->id]);

        $this->actingAs($dean)
            ->getJson("/api/universite/planning/{$theirSession->id}")
            ->assertStatus(404);
    }

    /** @test */
    public function a_student_may_not_schedule_a_session()
    {
        ['student' => $student, 'subject' => $subject] = $this->campus();

        $this->actingAs($student->user)
            ->postJson('/api/universite/planning', [
                'titre'       => 'Cours que je m\'invente',
                'date'        => now()->addDay()->format('Y-m-d'),
                'heure_debut' => '08:00',
                'heure_fin'   => '10:00',
                'matiere_id'  => $subject->id,
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function a_session_cannot_end_before_it_starts()
    {
        ['school' => $school, 'subject' => $subject] = $this->campus();

        $dean = User::factory()->create(['role' => 'doyen', 'ecole_id' => $school->id]);

        $this->actingAs($dean)
            ->postJson('/api/universite/planning', [
                'titre'       => 'Séance impossible',
                'date'        => now()->addDay()->format('Y-m-d'),
                'heure_debut' => '10:00',
                'heure_fin'   => '08:00',
                'matiere_id'  => $subject->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('heure_fin');
    }

    /** @test */
    public function scheduling_stores_the_time_as_written()
    {
        // The scholastic model casts its TIME columns to `datetime:H:i`, which
        // serialises back as `Y-m-d H:i:s` — a date crammed into a TIME column.
        // This model keeps the value a plain string, and this is the assertion
        // that would fail if someone reintroduced the cast.
        ['school' => $school, 'subject' => $subject] = $this->campus();

        $dean = User::factory()->create(['role' => 'doyen', 'ecole_id' => $school->id]);

        $id = $this->actingAs($dean)
            ->postJson('/api/universite/planning', [
                'titre'       => 'Cours magistral',
                'type'        => 'cours',
                'date'        => now()->addDay()->format('Y-m-d'),
                'heure_debut' => '14:30',
                'heure_fin'   => '16:30',
                'salle'       => 'Amphi B',
                'matiere_id'  => $subject->id,
            ])
            ->assertStatus(201)
            ->json('data.id');

        $session = EmploiDuTemps::findOrFail($id);

        $this->assertSame('14:30', $session->heure_debut);
        $this->assertSame('16:30', $session->heure_fin);
    }

    /** @test */
    public function scheduling_rejects_another_schools_subject()
    {
        $mine = Ecole::factory()->create(['status' => 'active']);
        ['school' => $school] = $this->campus($mine);

        $theirs = Ecole::factory()->create(['status' => 'active']);
        $this->actingAs(User::factory()->create(['role' => 'recteur', 'ecole_id' => $theirs->id]));
        $theirSubject = Matiere::factory()->create();

        $dean = User::factory()->create(['role' => 'doyen', 'ecole_id' => $school->id]);

        // `school_exists`, not `exists`: the built-in rule runs on the raw query
        // builder and would accept this id, leaving a foreign key pointing at
        // another tenant's row.
        $this->actingAs($dean)
            ->postJson('/api/universite/planning', [
                'titre'       => 'Séance croisée',
                'date'        => now()->addDay()->format('Y-m-d'),
                'heure_debut' => '08:00',
                'heure_fin'   => '10:00',
                'matiere_id'  => $theirSubject->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('matiere_id');
    }

    /* ─── /universite/devoirs ─────────────────────────────────────────── */

    /** @test */
    public function a_lecturer_sees_the_assignments_of_the_subjects_they_teach()
    {
        ['subject' => $subject, 'other' => $other, 'lecturer' => $lecturer] = $this->campus();

        $mine   = Devoir::factory()->create(['matiere_id' => $subject->id, 'titre' => 'Mon devoir']);
        $theirs = Devoir::factory()->create(['matiere_id' => $other->id, 'titre' => 'Devoir du collègue']);

        $titles = collect(
            $this->actingAs($lecturer->user)
                ->getJson('/api/universite/devoirs')
                ->assertStatus(200)
                ->json('data')
        )->pluck('titre');

        $this->assertContains($mine->titre, $titles);
        $this->assertNotContains($theirs->titre, $titles);
    }

    /** @test */
    public function a_student_sees_published_assignments_of_their_filiere_with_their_own_submission()
    {
        ['student' => $student, 'subject' => $subject, 'other' => $other] = $this->campus();

        $published = Devoir::factory()->create(['matiere_id' => $subject->id, 'titre' => 'À rendre']);
        $draft     = Devoir::factory()->draft()->create(['matiere_id' => $subject->id, 'titre' => 'Brouillon']);
        $foreign   = Devoir::factory()->create(['matiere_id' => $other->id, 'titre' => 'Autre filière']);

        $published->etudiants()->attach($student->id);

        $data = collect(
            $this->actingAs($student->user)
                ->getJson('/api/universite/devoirs')
                ->assertStatus(200)
                ->json('data')
        );

        $titles = $data->pluck('titre');

        $this->assertContains($published->titre, $titles);
        // A draft is not readable by the people it will be set to.
        $this->assertNotContains($draft->titre, $titles);
        $this->assertNotContains($foreign->titre, $titles);

        $mine = $data->firstWhere('titre', $published->titre);
        $this->assertNotNull($mine['ma_soumission']);
        $this->assertFalse($mine['ma_soumission']['rendu']);
    }

    /** @test */
    public function the_submission_counters_are_counted_not_stored()
    {
        ['student' => $student, 'subject' => $subject, 'lecturer' => $lecturer, 'filiere' => $filiere] = $this->campus();

        $classmate = Etudiant::factory()->create(['filiere_id' => $filiere->id]);

        $devoir = Devoir::factory()->create(['matiere_id' => $subject->id]);
        $devoir->etudiants()->attach($student->id, ['rendu' => true]);
        $devoir->etudiants()->attach($classmate->id, ['rendu' => false]);

        $data = collect(
            $this->actingAs($lecturer->user)->getJson('/api/universite/devoirs')->json('data')
        )->firstWhere('id', $devoir->id);

        $this->assertSame(1, $data['soumissions']);
        $this->assertSame(2, $data['total_etudiants']);
    }

    /** @test */
    public function publishing_an_assignment_enrols_the_whole_filiere()
    {
        ['subject' => $subject, 'lecturer' => $lecturer, 'filiere' => $filiere, 'other' => $other] = $this->campus();

        Etudiant::factory()->count(2)->create(['filiere_id' => $filiere->id]);

        $id = $this->actingAs($lecturer->user)
            ->postJson('/api/universite/devoirs', [
                'matiere_id'  => $subject->id,
                'titre'       => 'Dissertation',
                'date_limite' => now()->addWeek()->toDateTimeString(),
            ])
            ->assertStatus(201)
            ->json('data.id');

        // The denominator exists from the first read, instead of growing as
        // students happen to open the page.
        $expected = Etudiant::where('filiere_id', $filiere->id)->count();
        $this->assertSame($expected, Devoir::findOrFail($id)->etudiants()->count());
        $this->assertGreaterThan(1, $expected);
    }

    /** @test */
    public function a_lecturer_cannot_set_an_assignment_on_a_colleagues_subject()
    {
        ['other' => $other, 'lecturer' => $lecturer] = $this->campus();

        // `role:professeur` lets them reach the endpoint; only the policy-level
        // check knows the subject is not theirs.
        $this->actingAs($lecturer->user)
            ->postJson('/api/universite/devoirs', [
                'matiere_id' => $other->id,
                'titre'      => 'Devoir usurpé',
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function a_student_submits_their_work()
    {
        ['student' => $student, 'subject' => $subject] = $this->campus();

        $devoir = Devoir::factory()->create(['matiere_id' => $subject->id]);
        $devoir->etudiants()->attach($student->id);

        $this->actingAs($student->user)
            ->postJson("/api/universite/devoirs/{$devoir->id}/soumettre", [
                'reponse' => 'Voici ma copie.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $pivot = $devoir->fresh()->etudiants()->whereKey($student->id)->first()->pivot;

        $this->assertTrue((bool) $pivot->rendu);
        $this->assertSame('Voici ma copie.', $pivot->reponse);
    }

    /** @test */
    public function a_student_cannot_submit_to_another_filieres_assignment()
    {
        ['student' => $student, 'other' => $other] = $this->campus();

        $foreign = Devoir::factory()->create(['matiere_id' => $other->id]);

        // Without the filière check in the policy, any signed-in student could
        // submit to any assignment by changing the id in the URL.
        $this->actingAs($student->user)
            ->postJson("/api/universite/devoirs/{$foreign->id}/soumettre", ['reponse' => 'Bonjour'])
            ->assertStatus(403);
    }

    /** @test */
    public function a_student_cannot_submit_to_a_draft()
    {
        ['student' => $student, 'subject' => $subject] = $this->campus();

        $draft = Devoir::factory()->draft()->create(['matiere_id' => $subject->id]);

        $this->actingAs($student->user)
            ->postJson("/api/universite/devoirs/{$draft->id}/soumettre", ['reponse' => 'Bonjour'])
            ->assertStatus(403);
    }

    /** @test */
    public function marking_a_student_who_is_not_set_the_assignment_reports_it()
    {
        ['subject' => $subject, 'lecturer' => $lecturer, 'other' => $other] = $this->campus();

        $devoir   = Devoir::factory()->create(['matiere_id' => $subject->id]);
        $stranger = Etudiant::factory()->create(['filiere_id' => $other->filiere_id]);

        // `updateExistingPivot` silently does nothing for an unrelated id, so
        // without the check the caller is told the mark was saved.
        $this->actingAs($lecturer->user)
            ->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$stranger->id}/noter", [
                'note' => 15,
            ])
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function a_lecturer_marks_a_submission_of_their_own_subject()
    {
        ['student' => $student, 'subject' => $subject, 'lecturer' => $lecturer] = $this->campus();

        $devoir = Devoir::factory()->create(['matiere_id' => $subject->id]);
        $devoir->etudiants()->attach($student->id, ['rendu' => true]);

        $this->actingAs($lecturer->user)
            ->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$student->id}/noter", [
                'note'        => 16.5,
                'commentaire' => 'Bon travail',
            ])
            ->assertStatus(200);

        $pivot = $devoir->fresh()->etudiants()->whereKey($student->id)->first()->pivot;

        $this->assertEquals(16.5, $pivot->note);
    }

    /** @test */
    public function a_lecturer_cannot_mark_a_colleagues_assignment()
    {
        ['other' => $other, 'lecturer' => $lecturer, 'otherFiliere' => $otherFiliere] = $this->campus();

        $devoir  = Devoir::factory()->create(['matiere_id' => $other->id]);
        $pupil   = Etudiant::factory()->create(['filiere_id' => $otherFiliere->id]);
        $devoir->etudiants()->attach($pupil->id);

        $this->actingAs($lecturer->user)
            ->postJson("/api/universite/devoirs/{$devoir->id}/etudiants/{$pupil->id}/noter", ['note' => 20])
            ->assertStatus(403);
    }

    /** @test */
    public function an_assignment_from_another_school_is_not_found()
    {
        $mine = Ecole::factory()->create(['status' => 'active']);
        ['lecturer' => $lecturer] = $this->campus($mine);

        $theirs = Ecole::factory()->create(['status' => 'active']);
        $this->actingAs(User::factory()->create(['role' => 'recteur', 'ecole_id' => $theirs->id]));
        $theirDevoir = Devoir::factory()->create();

        $this->actingAs($lecturer->user)
            ->getJson("/api/universite/devoirs/{$theirDevoir->id}")
            ->assertStatus(404);
    }

    /* ─── The university module has no cycle ──────────────────────────── */

    /** @test */
    public function no_university_model_claims_a_cycle_it_cannot_reach()
    {
        // `CONCEPTION_CLOISONNEMENT.md` puts the whole university module among
        // the tables with no path to a cycle: the hierarchy is
        // faculté → département → filière → semestre, and nothing there reaches
        // a `classes` row, which is where `categorie_classe` lives. Adopting
        // `ScopedToCycle` would therefore be declaring a path that does not
        // exist — the exact defect its abstract `cyclePath()` exists to catch.
        foreach ([Devoir::class, EmploiDuTemps::class, Etudiant::class, Matiere::class] as $class) {
            $this->assertNotContains(
                \App\Traits\ScopedToCycle::class,
                class_uses_recursive($class),
                "{$class} ne doit pas adopter ScopedToCycle : il n'atteint aucune classe"
            );

            // Tenant scoping, on the other hand, is mandatory.
            $this->assertContains(
                \App\Traits\BelongsToEcole::class,
                class_uses_recursive($class),
                "{$class} doit porter BelongsToEcole"
            );
        }
    }

    /** @test */
    public function the_new_university_tables_restrict_school_deletion()
    {
        // Enforced globally by SchoolDeactivationTest, asserted here too so a
        // failure names the table that introduced the cascade.
        foreach (['uni_emplois_du_temps', 'uni_devoirs'] as $table) {
            $rules = collect(Schema::getForeignKeys($table))
                ->filter(fn($fk) => in_array('ecole_id', $fk['columns'] ?? [], true))
                ->pluck('on_delete')
                ->map(fn($rule) => strtolower((string) $rule));

            $this->assertNotEmpty($rules, "{$table} doit déclarer une clé étrangère sur ecole_id");
            $this->assertNotContains('cascade', $rules, "{$table} cascade sur ecole_id");
        }
    }

    /* ─── Fixture ─────────────────────────────────────────────────────── */

    /**
     * A campus: two filières, two lecturers, one subject each, one student.
     *
     * Two of everything on purpose. A single-filière fixture cannot tell a
     * correctly narrowed answer from an unnarrowed one — every assertion about
     * scoping needs something that must *not* come back.
     *
     * @return array{school: Ecole, filiere: Filiere, otherFiliere: Filiere,
     *               subject: Matiere, other: Matiere, student: Etudiant,
     *               lecturer: Enseignant}
     */
    private function campus(?Ecole $school = null): array
    {
        $school = $this->actingInSchool($school, role: 'recteur');

        $filiere      = Filiere::factory()->create();
        $otherFiliere = Filiere::factory()->create();

        $lecturerAccount = User::factory()->create(['role' => 'professeur', 'ecole_id' => $school->id]);
        $lecturer        = Enseignant::factory()->forUser($lecturerAccount)->create();
        $otherLecturer   = Enseignant::factory()->create();

        $subject = Matiere::factory()->create([
            'filiere_id'    => $filiere->id,
            'enseignant_id' => $lecturer->id,
        ]);
        $other = Matiere::factory()->create([
            'filiere_id'    => $otherFiliere->id,
            'enseignant_id' => $otherLecturer->id,
        ]);

        $studentAccount = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $school->id]);
        $student        = Etudiant::factory()->forUser($studentAccount)->create(['filiere_id' => $filiere->id]);

        return compact('school', 'filiere', 'otherFiliere', 'subject', 'other', 'student', 'lecturer');
    }
}
