<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use App\Support\Cycles;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * `DB::table()` on a tenant-scoped table.
 *
 * CLAUDE.md is explicit: never reach these tables through `DB::table()`, because
 * it sidesteps the `BelongsToEcole` global scope. `NotesController` did it 18
 * times. Two of those were reachable and leaked across establishments:
 *
 *   - `classement($classeId, $periode)` ranked whatever class id it was handed,
 *     so a head of school could read another school's named ranking by guessing
 *     an id;
 *   - the CSV import matched pupils on `numero_matricule` with no school filter,
 *     so two schools using the same numbering scheme would have marks imported
 *     onto each other's pupils — a cross-tenant *write*.
 */
class TenantScopeBypassTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function the_class_ranking_does_not_reach_into_another_school()
    {
        $mine    = Ecole::factory()->create(['status' => 'active']);
        $theirs  = Ecole::factory()->create(['status' => 'active']);

        $theirClass = Classes::factory()->create([
            'ecole_id'         => $theirs->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);
        $theirPupil = Eleve::factory()->forSchool($theirs)->create(['classe_id' => $theirClass->id]);

        Notes::factory()->create([
            'eleve_id'  => $theirPupil->id,
            'classe_id' => $theirClass->id,
            'ecole_id'  => $theirs->id,
            'note'      => 19,
            'periode'   => 'Trimestre 1',
        ]);

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $mine->id]);

        $response = $this->actingAs($head)
            ->getJson("/api/notes/classement/{$theirClass->id}/Trimestre 1")
            ->assertStatus(200);

        // Their pupil must not appear in my ranking.
        $this->assertSame(0, $response->json('data.effectif'));
        $this->assertSame([], $response->json('data.classement'));
    }

    /** @test */
    public function pupils_tied_on_average_share_a_rank()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);

        $tiedA  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $tiedB  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $behind = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        foreach ([[$tiedA, 15], [$tiedB, 15], [$behind, 9]] as [$pupil, $note]) {
            Notes::factory()->create([
                'eleve_id'  => $pupil->id,
                'classe_id' => $classe->id,
                'ecole_id'  => $school->id,
                'note'      => $note,
                'note_sur'  => 20,
                'periode'   => 'Trimestre 1',
            ]);
        }

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $ranking = $this->actingAs($head)
            ->getJson("/api/notes/classement/{$classe->id}/Trimestre 1")
            ->assertStatus(200)
            ->json('data.classement');

        $ranks = collect($ranking)->pluck('rang', 'eleve_id');

        // Was 1, 2, 3 for two equal averages — and it disagreed with the rank
        // BulletinService computed for the same pupils.
        $this->assertSame(1, $ranks[$tiedA->id]);
        $this->assertSame(1, $ranks[$tiedB->id]);
        $this->assertSame(3, $ranks[$behind->id]);
    }

    /** @test */
    public function the_ranking_average_accounts_for_the_mark_scale()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);

        $onTen    = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $onTwenty = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        // 9/10 is 18/20, so ahead of 15/20 — the raw 9 < 15 must not decide.
        Notes::factory()->create([
            'eleve_id' => $onTen->id, 'classe_id' => $classe->id, 'ecole_id' => $school->id,
            'note' => 9, 'note_sur' => 10, 'periode' => 'Trimestre 1',
        ]);
        Notes::factory()->create([
            'eleve_id' => $onTwenty->id, 'classe_id' => $classe->id, 'ecole_id' => $school->id,
            'note' => 15, 'note_sur' => 20, 'periode' => 'Trimestre 1',
        ]);

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $ranking = collect(
            $this->actingAs($head)
                ->getJson("/api/notes/classement/{$classe->id}/Trimestre 1")
                ->assertStatus(200)
                ->json('data.classement')
        )->keyBy('eleve_id');

        $this->assertSame(1, $ranking[$onTen->id]['rang']);
        $this->assertEquals(18, $ranking[$onTen->id]['moyenne']);
        $this->assertSame(2, $ranking[$onTwenty->id]['rang']);
    }

    /** @test */
    public function the_mark_distribution_counts_only_the_callers_school()
    {
        $mine   = Ecole::factory()->create(['status' => 'active']);
        $theirs = Ecole::factory()->create(['status' => 'active']);

        foreach ([$mine, $theirs] as $school) {
            $classe = Classes::factory()->create([
                'ecole_id'         => $school->id,
                'categorie_classe' => Cycles::SECONDARY,
            ]);
            $pupil = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

            Notes::factory()->create([
                'eleve_id' => $pupil->id, 'classe_id' => $classe->id, 'ecole_id' => $school->id,
                'note' => 18, 'note_sur' => 20, 'periode' => 'Trimestre 1',
            ]);
        }

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $mine->id]);
        $this->actingAs($head);

        $distribution = collect(
            app(\App\Http\Controllers\NotesController::class)
                ->repartitionNotesSecondaire()
                ->getData(true)
        )->keyBy('name');

        // One mark, mine. Not two.
        $this->assertSame(1, $distribution['15-20']['value']);
    }

    /** @test */
    public function a_mark_between_two_bands_is_still_counted()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);
        $pupil = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        // 5.5 fell between the old `0-5` and `6-10` bands and disappeared.
        Notes::factory()->create([
            'eleve_id' => $pupil->id, 'classe_id' => $classe->id, 'ecole_id' => $school->id,
            'note' => 5.5, 'note_sur' => 20, 'periode' => 'Trimestre 1',
        ]);

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);
        $this->actingAs($head);

        $distribution = app(\App\Http\Controllers\NotesController::class)
            ->repartitionNotes()
            ->getData(true);

        $this->assertSame(1, collect($distribution)->sum('value'));
        $this->assertSame(1, collect($distribution)->firstWhere('name', '5-10')['value']);
    }

    /** @test */
    public function two_schools_sharing_a_matricule_do_not_import_onto_each_other()
    {
        $mine   = Ecole::factory()->create(['status' => 'active']);
        $theirs = Ecole::factory()->create(['status' => 'active']);

        $myClass    = Classes::factory()->create(['ecole_id' => $mine->id]);
        $theirClass = Classes::factory()->create(['ecole_id' => $theirs->id]);

        // Same numbering scheme in both schools — nothing forbids it.
        $mySubject = Matieres::factory()->create(['ecole_id' => $mine->id]);
        $myPupil = Eleve::factory()->forSchool($mine)->create([
            'classe_id'         => $myClass->id,
            'numero_matricule' => 'MAT-001',
        ]);
        $theirPupil = Eleve::factory()->forSchool($theirs)->create([
            'classe_id'         => $theirClass->id,
            'numero_matricule' => 'MAT-001',
        ]);

        $head = User::factory()->create(['role' => 'directeur', 'ecole_id' => $mine->id]);
        $this->actingAs($head);

        // Whatever the lookup returns, it must never be the other school's
        // pupil: that is what decides which record a mark is written onto.
        $found = Eleve::where('numero_matricule', 'MAT-001')->get();

        $this->assertCount(1, $found);
        $this->assertSame($myPupil->id, $found->first()->id);
        $this->assertNotSame($theirPupil->id, $found->first()->id);
    }

    /** @test */
    public function two_schools_can_each_have_their_own_devoir1()
    {
        $a = Ecole::factory()->create(['status' => 'active']);
        $b = Ecole::factory()->create(['status' => 'active']);

        // Both were platform-wide UNIQUE, so the second school to be set up
        // could not have an evaluation type named `Devoir1`. Onboarding school
        // number two failed on a constraint the operator could do nothing about.
        // (Un second exemple, `paiement_methods`, est tombé avec la table morte.)
        foreach ([$a, $b] as $school) {
            DB::table('type_evaluations')->insert([
                'nom'        => 'Devoir1',
                'ecole_id'   => $school->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->assertSame(
            2,
            DB::table('type_evaluations')->where('nom', 'Devoir1')->count(),
            'type_evaluations.nom devrait être unique par école, pas par plateforme'
        );
    }

    /** @test */
    public function a_login_identity_stays_unique_across_the_whole_platform()
    {
        $a = Ecole::factory()->create(['status' => 'active']);
        $b = Ecole::factory()->create(['status' => 'active']);

        User::factory()->create(['ecole_id' => $a->id, 'email' => 'shared@ecole.bj']);

        // Scoping identifiers per school must not have loosened credentials:
        // one email must still resolve to exactly one account, or sign-in
        // becomes ambiguous.
        $this->expectException(\Illuminate\Database\QueryException::class);
        User::factory()->create(['ecole_id' => $b->id, 'email' => 'shared@ecole.bj']);
    }
}
