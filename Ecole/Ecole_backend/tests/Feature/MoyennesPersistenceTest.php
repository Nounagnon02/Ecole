<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Moyennes;
use App\Models\Notes;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Instantané des moyennes/rangs archivé au verrouillage du bulletin.
 *
 * La table `moyennes` était un stub sans colonne métier. Elle porte
 * désormais, par élève et par période, la moyenne et le rang de chaque
 * matière plus la moyenne générale pondérée et le rang général. Ces tests
 * garantissent que l'instantané stocké coïncide avec le bulletin calculé à la
 * volée et avec le classement — c'est-à-dire que le chiffre figé est le même
 * que celui qui a été montré au parent.
 */
class MoyennesPersistenceTest extends TestCase
{
    use RefreshDatabase;

    private function mark(Eleve $pupil, Matieres $subject, string $type, float $note, float $scale = 20): void
    {
        Notes::factory()->create([
            'eleve_id' => $pupil->id,
            'matiere_id' => $subject->id,
            'classe_id' => $pupil->class_id,
            'ecole_id' => $pupil->ecole_id,
            'type_evaluation' => $type,
            'note' => $note,
            'note_sur' => $scale,
            'periode' => 'Trimestre 1',
        ]);
    }

    /** @test */
    public function recalculer_persists_subject_and_general_rows_with_ranks()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $best = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $middle = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $last = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $maths = Matieres::factory()->create(['ecole_id' => $school->id]);

        DB::table('classe_matieres')->insert([
            ['classe_id' => $classe->id, 'matiere_id' => $maths->id, 'coefficient' => 4, 'ecole_id' => $school->id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->mark($best, $maths, 'Devoir1', 18);
        $this->mark($middle, $maths, 'Devoir1', 12);
        $this->mark($last, $maths, 'Devoir1', 6);

        $response = $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        // 3 lignes générales + 3 lignes matière.
        $this->assertDatabaseCount('moyennes', 6);

        $generalBest = Moyennes::where('eleve_id', $best->id)
            ->whereNull('matiere_id')
            ->first();

        $this->assertNotNull($generalBest);
        $this->assertSame(18.0, (float) $generalBest->valeur);
        $this->assertSame(1, $generalBest->rang);
        $this->assertSame(3, $generalBest->total_eleves);
        $this->assertSame($classe->id, $generalBest->classe_id);
        $this->assertSame('Trimestre 1', $generalBest->periode);

        $subjectBest = Moyennes::where('eleve_id', $best->id)
            ->where('matiere_id', $maths->id)
            ->first();

        $this->assertNotNull($subjectBest);
        $this->assertSame(18.0, (float) $subjectBest->valeur);
        $this->assertSame(4.0, (float) $subjectBest->coefficient);
        $this->assertSame(1, $subjectBest->rang);

        $generalLast = Moyennes::where('eleve_id', $last->id)
            ->whereNull('matiere_id')
            ->first();

        $this->assertSame(3, $generalLast->rang);
    }

    /** @test */
    public function the_stored_general_rank_matches_the_classement_endpoint()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $best = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $middle = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $last = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($best, $subject, 'Devoir1', 16);
        $this->mark($middle, $subject, 'Devoir1', 14);
        $this->mark($last, $subject, 'Devoir1', 10);

        $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ])->assertOk();

        $classement = $this->getJson("/api/notes/classement/{$classe->id}/Trimestre 1")
            ->assertOk()
            ->json('data.classement');

        $classementRanks = collect($classement)
            ->mapWithKeys(fn ($row) => [$row['eleve_id'] => $row['rang']]);

        foreach ([$best->id, $middle->id, $last->id] as $eleveId) {
            $stored = Moyennes::where('eleve_id', $eleveId)
                ->whereNull('matiere_id')
                ->first();

            // Le rang archivé au verrouillage est exactement celui du classement.
            $this->assertSame($classementRanks->get($eleveId), $stored->rang);
        }
    }

    /** @test */
    public function recalculer_replaces_the_previous_snapshot()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $pupil = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($pupil, $subject, 'Devoir1', 10);
        $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ])->assertOk();

        // Correction de la note après coup : le verrouillage doit remplacer,
        // pas accumuler.
        Notes::where('eleve_id', $pupil->id)->update(['note' => 16]);

        $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ])->assertOk();

        $this->assertDatabaseCount('moyennes', 2);

        $general = Moyennes::where('eleve_id', $pupil->id)
            ->whereNull('matiere_id')
            ->first();

        $this->assertSame(16.0, (float) $general->valeur);
    }

    /** @test */
    public function a_parent_only_reads_their_own_childrens_snapshot()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $mine = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $theirs = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);
        $subject = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->mark($mine, $subject, 'Devoir1', 14);
        $this->mark($theirs, $subject, 'Devoir1', 8);

        $this->postJson('/api/moyennes/recalculer', [
            'classe_id' => $classe->id,
            'periode' => 'Trimestre 1',
        ])->assertOk();

        // Le parent est rattaché à un seul de ses enfants.
        $parent = UserParent::create([
            'user_id' => User::factory()->create(['role' => 'parent', 'ecole_id' => $school->id])->id,
            'ecole_id' => $school->id,
        ]);
        $parent->eleves()->attach($mine->id);

        $this->actingAs($parent->user);

        $rows = $this->getJson('/api/moyennes?periode=Trimestre 1')
            ->assertOk()
            ->json('data');

        $seen = collect($rows)->pluck('eleve_id')->unique()->values();

        $this->assertTrue($seen->contains($mine->id));
        $this->assertFalse($seen->contains($theirs->id));
    }
}
