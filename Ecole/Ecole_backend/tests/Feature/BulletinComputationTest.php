<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Services\BulletinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Report card arithmetic.
 *
 * These computations decide what a family sees on a report card, and a wrong
 * figure is invisible without a test. The defects covered here were all live:
 *
 *   - the subject average divided by a hardcoded 3, so a pupil marked only on
 *     Devoir1 at 15/20 came out at 5/20;
 *   - `note_sur` was ignored in one code path, so 8/10 counted as 8/20;
 *   - `filter()` without a callback dropped a genuine 0, inflating averages;
 *   - the coefficient lookup queried `classe_matiere`, a table that does not
 *     exist, so every lookup threw;
 *   - both rank computations returned position 1 when the pupil could not be
 *     placed, quietly declaring them top of the class.
 */
class BulletinComputationTest extends TestCase
{
    use RefreshDatabase;

    private function mark(Eleve $pupil, Matieres $subject, string $type, float $note, float $scale = 20): void
    {
        Notes::factory()->create([
            'eleve_id'        => $pupil->id,
            'matiere_id'      => $subject->id,
            'classe_id'       => $pupil->class_id,
            'ecole_id'        => $pupil->ecole_id,
            'type_evaluation' => $type,
            'note'            => $note,
            'note_sur'        => $scale,
            'periode'         => 'Semestre 1',
        ]);
    }

    /** @test */
    public function a_single_mark_is_not_divided_by_three()
    {
        $school  = $this->actingInSchool();
        $pupil   = Eleve::factory()->forSchool($school)->create();
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($pupil, $subject, 'Devoir1', 15);

        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        // 15, not 5.
        $this->assertEquals(15, $report['moyennes_par_matiere'][0]['moyenne']);
    }

    /** @test */
    public function marks_are_brought_back_to_a_scale_of_twenty()
    {
        $school  = $this->actingInSchool();
        $pupil   = Eleve::factory()->forSchool($school)->create();
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($pupil, $subject, 'Devoir1', 8, 10);

        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        // 8 out of 10 is 16 out of 20.
        $this->assertEquals(16, $report['moyennes_par_matiere'][0]['moyenne']);
    }

    /** @test */
    public function a_genuine_zero_counts_towards_the_average()
    {
        $school  = $this->actingInSchool();
        $pupil   = Eleve::factory()->forSchool($school)->create();
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($pupil, $subject, 'Devoir1', 20);
        $this->mark($pupil, $subject, 'Devoir2', 0);

        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        // (20 + 0) / 2 = 10. Dropping the zero would have given 20.
        $this->assertEquals(10, $report['moyennes_par_matiere'][0]['moyenne']);
    }

    /** @test */
    public function the_coefficient_is_read_from_the_class_subject_table()
    {
        $school  = $this->actingInSchool();
        $classe  = Classes::factory()->create(['ecole_id' => $school->id]);
        $pupil   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        DB::table('classe_matieres')->insert([
            'classe_id'   => $classe->id,
            'matiere_id'  => $subject->id,
            'coefficient' => 4,
            'ecole_id'    => $school->id,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $this->mark($pupil, $subject, 'Devoir1', 15);

        // Used to throw: the query targeted `classe_matiere`, singular.
        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        $subjectLine = $report['moyennes_par_matiere'][0];
        $this->assertEquals(4, $subjectLine['coefficient']);
        $this->assertEquals(60, $subjectLine['moyenne_ponderee']);
    }

    /** @test */
    public function the_general_average_is_weighted_by_coefficient()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $pupil  = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $maths  = Matieres::factory()->create(['ecole_id' => $school->id]);
        $sport  = Matieres::factory()->create(['ecole_id' => $school->id]);

        DB::table('classe_matieres')->insert([
            ['classe_id' => $classe->id, 'matiere_id' => $maths->id, 'coefficient' => 4, 'ecole_id' => $school->id, 'created_at' => now(), 'updated_at' => now()],
            ['classe_id' => $classe->id, 'matiere_id' => $sport->id, 'coefficient' => 1, 'ecole_id' => $school->id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->mark($pupil, $maths, 'Devoir1', 20);
        $this->mark($pupil, $sport, 'Devoir1', 10);

        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        // (20×4 + 10×1) / 5 = 18, not the unweighted 15.
        $this->assertEquals(18, $report['moyenne_generale']);
    }

    /* ─── Ranking ─────────────────────────────────────────────────────── */

    /** @test */
    public function the_best_pupil_is_first_and_the_weakest_last()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $best   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $middle = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $last   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($best, $subject, 'Devoir1', 18);
        $this->mark($middle, $subject, 'Devoir1', 12);
        $this->mark($last, $subject, 'Devoir1', 6);

        $service = app(BulletinService::class);

        $this->assertSame(1, $service->bulletinSecondaire($best->id, 'Semestre 1')['rang']['position']);
        $this->assertSame(2, $service->bulletinSecondaire($middle->id, 'Semestre 1')['rang']['position']);
        $this->assertSame(3, $service->bulletinSecondaire($last->id, 'Semestre 1')['rang']['position']);
    }

    /** @test */
    public function ranking_compares_performance_not_raw_marks()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $onTen     = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $onTwenty  = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        // 9/10 is 18/20 — better than 15/20, even though 9 < 15.
        $this->mark($onTen, $subject, 'Devoir1', 9, 10);
        $this->mark($onTwenty, $subject, 'Devoir1', 15, 20);

        $service = app(BulletinService::class);

        $this->assertSame(1, $service->bulletinSecondaire($onTen->id, 'Semestre 1')['rang']['position']);
        $this->assertSame(2, $service->bulletinSecondaire($onTwenty->id, 'Semestre 1')['rang']['position']);
    }

    /** @test */
    public function two_pupils_with_the_same_average_share_a_rank()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $first  = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $tied   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $behind = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($first, $subject, 'Devoir1', 14);
        $this->mark($tied, $subject, 'Devoir1', 14);
        $this->mark($behind, $subject, 'Devoir1', 8);

        $service = app(BulletinService::class);

        $this->assertSame(1, $service->bulletinSecondaire($first->id, 'Semestre 1')['rang']['position']);
        $this->assertSame(1, $service->bulletinSecondaire($tied->id, 'Semestre 1')['rang']['position']);
        // Two pupils ahead, so third.
        $this->assertSame(3, $service->bulletinSecondaire($behind->id, 'Semestre 1')['rang']['position']);
    }

    /** @test */
    public function a_pupil_with_no_marks_is_not_reported_as_first()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $marked   = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $unmarked = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);
        $this->mark($marked, $subject, 'Devoir1', 17);

        $report = app(BulletinService::class)->bulletinSecondaire($unmarked->id, 'Semestre 1');

        // No marks means a 0 average, so last — never first. The old code
        // returned position 1 whenever the pupil could not be placed.
        $this->assertNotSame(1, $report['rang']['position']);
        $this->assertSame(2, $report['rang']['position']);
    }

    /** @test */
    public function a_zero_scale_does_not_divide_by_zero()
    {
        $school  = $this->actingInSchool();
        $pupil   = Eleve::factory()->forSchool($school)->create();
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        // `note_sur` is writable, so guard the degenerate case.
        $this->mark($pupil, $subject, 'Devoir1', 10, 0);

        $report = app(BulletinService::class)->bulletinSecondaire($pupil->id, 'Semestre 1');

        $this->assertEquals(0, $report['moyennes_par_matiere'][0]['moyenne']);
    }
}
