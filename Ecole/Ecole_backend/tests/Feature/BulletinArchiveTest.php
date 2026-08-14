<?php

namespace Tests\Feature;

use App\Models\Bulletin;
use App\Models\Classes;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;
use App\Models\UserParent;
use App\Services\BulletinService;
use App\Support\AnneeScolaire;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Archive immuable des bulletins (`bulletins`) et dimension « année scolaire ».
 *
 * Le bulletin se verrouille : moyenne, rang, mention et détail par matière sont
 * figés pour (élève, période, année scolaire), même si les notes bougent ensuite.
 */
class BulletinArchiveTest extends TestCase
{
    use RefreshDatabase;

    private function mark(Eleve $pupil, Matieres $subject, float $note): void
    {
        Notes::factory()->create([
            'eleve_id' => $pupil->id,
            'matiere_id' => $subject->id,
            'classe_id' => $pupil->classe_id,
            'ecole_id' => $pupil->ecole_id,
            'type_evaluation' => 'Devoir1',
            'note' => $note,
            'note_sur' => 20,
            'periode' => 'Trimestre 1',
        ]);
    }

    private function snapshot(Classes $classe): void
    {
        $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ])->assertOk();
    }

    private function lock(Classes $classe): TestResponse
    {
        return $this->postJson('/api/bulletins/verrouiller', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ]);
    }

    /** @test */
    public function verrouiller_freezes_one_bulletin_per_pupil_with_mention_and_detail()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $best = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $middle = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $last = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $maths = Matieres::factory()->create(['ecole_id' => $school->id]);
        DB::table('classe_matieres')->insert([
            ['classe_id' => $classe->id, 'matiere_id' => $maths->id, 'coefficient' => 4, 'ecole_id' => $school->id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->mark($best, $maths, 18);
        $this->mark($middle, $maths, 12);
        $this->mark($last, $maths, 6);

        $this->snapshot($classe);

        $this->lock($classe)->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseCount('bulletins', 3);

        $bulletin = Bulletin::where('eleve_id', $best->id)->first();
        $this->assertNotNull($bulletin);
        $this->assertSame(18.0, (float) $bulletin->moyenne_generale);
        $this->assertSame(1, $bulletin->rang);
        $this->assertSame(3, $bulletin->total_eleves);
        $this->assertSame('Très Bien', $bulletin->mention);
        $this->assertSame('Trimestre 1', $bulletin->periode);
        $this->assertSame(AnneeScolaire::courante(), $bulletin->annee_scolaire);
        $this->assertSame($classe->id, $bulletin->classe_id);
        $this->assertSame($school->id, $bulletin->ecole_id);

        // Le détail figé porte la moyenne, le coefficient et le rang par matière.
        $detail = $bulletin->data;
        $this->assertIsArray($detail);
        $this->assertCount(1, $detail);
        $this->assertSame($maths->nom, $detail[0]['matiere']);
        $this->assertSame(18.0, (float) $detail[0]['moyenne']);
        $this->assertSame(4.0, (float) $detail[0]['coefficient']);
        $this->assertSame(1, $detail[0]['rang']);

        // Mention du dernier : Insuffisant.
        $this->assertSame('Insuffisant', Bulletin::where('eleve_id', $last->id)->value('mention'));
    }

    /** @test */
    public function verrouiller_replaces_the_previous_archive_after_a_correction()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $pupil = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($pupil, $subject, 10);
        $this->snapshot($classe);
        $this->lock($classe)->assertOk();

        // Correction de la note après verrouillage : le reverrouillage remplace.
        Notes::where('eleve_id', $pupil->id)->update(['note' => 16]);
        $this->snapshot($classe);
        $this->lock($classe)->assertOk();

        $this->assertDatabaseCount('bulletins', 1);

        $bulletin = Bulletin::where('eleve_id', $pupil->id)->first();
        $this->assertSame(16.0, (float) $bulletin->moyenne_generale);
        $this->assertSame('Très Bien', $bulletin->mention);
    }

    /** @test */
    public function verrouiller_without_a_snapshot_archives_nothing()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $this->lock($classe)->assertOk()->assertJson(['data' => []]);
        $this->assertDatabaseCount('bulletins', 0);
    }

    /** @test */
    public function verrouiller_rejects_an_invalid_school_year()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $this->postJson('/api/bulletins/verrouiller', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
            'annee_scolaire' => '2026',
        ])->assertStatus(422);
    }

    /** @test */
    public function a_parent_only_reads_their_own_childrens_bulletins()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $mine = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $theirs = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($mine, $subject, 14);
        $this->mark($theirs, $subject, 8);
        $this->snapshot($classe);
        $this->lock($classe)->assertOk();

        $parent = UserParent::create([
            'user_id' => User::factory()->create(['role' => 'parent', 'ecole_id' => $school->id])->id,
            'ecole_id' => $school->id,
        ]);
        $parent->eleves()->attach($mine->id);

        $this->actingAs($parent->user);

        $rows = $this->getJson('/api/bulletins?periode=Trimestre 1')
            ->assertOk()
            ->json('data');

        $seen = collect($rows)->pluck('eleve_id')->unique()->values();

        $this->assertTrue($seen->contains($mine->id));
        $this->assertFalse($seen->contains($theirs->id));
    }

    /** @test */
    public function note_creation_defaults_to_the_current_school_year()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $pupil = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->postJson('/api/notes/store', [
            'eleve_id' => $pupil->id,
            'classe_id' => $classe->id,
            'matiere_id' => $subject->id,
            'note' => 14,
            'note_sur' => 20,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => '2026-10-05',
            'periode' => 'Trimestre 1',
        ])->assertCreated()->assertJson(['success' => true]);

        $this->assertDatabaseHas('notes', [
            'eleve_id' => $pupil->id,
            'annee_scolaire' => AnneeScolaire::courante(),
        ]);
    }

    /** @test */
    public function the_mention_thresholds_follow_the_bénin_scale()
    {
        $service = app(BulletinService::class);

        $this->assertSame('Très Bien', $service->mentionPour(16.0));
        $this->assertSame('Bien', $service->mentionPour(14.0));
        $this->assertSame('Assez Bien', $service->mentionPour(12.0));
        $this->assertSame('Passable', $service->mentionPour(10.0));
        $this->assertSame('Insuffisant', $service->mentionPour(9.99));
    }
}
