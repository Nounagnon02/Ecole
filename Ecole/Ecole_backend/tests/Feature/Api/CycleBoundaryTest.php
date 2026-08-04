<?php

namespace Tests\Feature\Api;

use App\Exceptions\OutsideCycleException;
use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\User;
use App\Support\Cycles;
use App\Support\CycleAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The cycle boundary.
 *
 * A school runs three cycles, each with its own head. Until this change that
 * authority was a label: `directeurM`, `directeurP` and `directeurS` were
 * granted exactly what the general head could do, and the separation rested on
 * each cycle dashboard choosing to call its own endpoints. Nothing stopped the
 * primary head from reading — or rewriting — the secondary's records.
 *
 * These tests fix the boundary in both directions: a cycle head is confined,
 * and everyone else is untouched. The second half matters as much as the first;
 * a boundary that also constrains teachers, parents or the bursar would be a
 * regression dressed up as a security feature.
 */
class CycleBoundaryTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Classes $primary;
    private Classes $secondary;
    private Eleve $primaryPupil;
    private Eleve $secondaryPupil;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);

        // Built as an unrestricted user, so the fixtures themselves are not
        // filtered by the boundary under test.
        $this->actingAs($this->staffWithRole('directeur'));

        $this->primary = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => Cycles::PRIMARY,
        ]);
        $this->secondary = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => Cycles::SECONDARY,
        ]);

        $this->primaryPupil = Eleve::factory()->forSchool($this->school)
            ->create(['class_id' => $this->primary->id]);
        $this->secondaryPupil = Eleve::factory()->forSchool($this->school)
            ->create(['class_id' => $this->secondary->id]);
    }

    private function staffWithRole(string $role): User
    {
        return User::factory()->create([
            'role'     => $role,
            'ecole_id' => $this->school->id,
        ]);
    }

    private function markFor(Eleve $pupil, float $note = 12): Notes
    {
        return Notes::factory()->create([
            'eleve_id'  => $pupil->id,
            'classe_id' => $pupil->class_id,
            'ecole_id'  => $this->school->id,
            'note'      => $note,
            'periode'   => 'Semestre 1',
        ]);
    }

    /* ─── The declarations must match the schema ──────────────────────── */

    /** @test */
    public function every_scoped_model_declares_a_column_that_exists()
    {
        // A declared path pointing at a missing column is not a typo you find
        // by reading — it surfaces as an SQL error on whatever page happens to
        // query that model first. `EmploiDuTemps` was declared on `class_id`
        // while the table carries `classe_id`, and its own `$fillable` had the
        // same mistake, which is how the wrong name looked plausible.
        $models = [
            \App\Models\Classes::class,
            \App\Models\Eleve::class,
            \App\Models\Notes::class,
            \App\Models\Absence::class,
            \App\Models\EmploiDuTemps::class,
            \App\Models\Devoir::class,
            \App\Models\CahierDeTexte::class,
            \App\Models\ConseilClasse::class,
            \App\Models\Sanction::class,
            \App\Models\Certificat::class,
            \App\Models\PaiementEleve::class,
        ];

        foreach ($models as $class) {
            $model = new $class;
            $table = $model->getTable();

            $path = (function () {
                return static::cyclePath();
            })->call($model);

            $this->assertCount(1, $path, "{$class}::cyclePath() doit déclarer exactement un chemin");

            $column = reset($path);

            $this->assertTrue(
                \Illuminate\Support\Facades\Schema::hasColumn($table, $column),
                "{$class} déclare {$table}.{$column}, qui n'existe pas"
            );

            // And a fillable that names a column the table does not have is the
            // same defect one layer up.
            foreach ($model->getFillable() as $fillable) {
                $this->assertTrue(
                    \Illuminate\Support\Facades\Schema::hasColumn($table, $fillable),
                    "{$class} rend assignable {$table}.{$fillable}, qui n'existe pas"
                );
            }
        }
    }

    /* ─── A cycle head is confined ────────────────────────────────────── */

    /** @test */
    public function a_cycle_head_sees_only_the_classes_of_their_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        $classes = Classes::all();

        $this->assertCount(1, $classes);
        $this->assertSame($this->primary->id, $classes->first()->id);
    }

    /** @test */
    public function a_cycle_head_sees_only_the_pupils_of_their_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurS'));

        $pupils = Eleve::all();

        $this->assertCount(1, $pupils);
        $this->assertSame($this->secondaryPupil->id, $pupils->first()->id);
    }

    /** @test */
    public function a_class_from_another_cycle_cannot_be_fetched_by_id()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        // Not merely absent from the list — unreachable even when the id is
        // known, which is how a scope differs from a filtered index.
        $this->assertNull(Classes::find($this->secondary->id));
        $this->assertNotNull(Classes::find($this->primary->id));
    }

    /** @test */
    public function marks_are_confined_through_the_class_key()
    {
        $this->actingAs($this->staffWithRole('directeur'));
        $primaryMark   = $this->markFor($this->primaryPupil, 14);
        $secondaryMark = $this->markFor($this->secondaryPupil, 17);

        $this->actingAs($this->staffWithRole('directeurP'));

        $marks = Notes::all();
        $this->assertCount(1, $marks);
        $this->assertSame($primaryMark->id, $marks->first()->id);
        $this->assertNull(Notes::find($secondaryMark->id));
    }

    /** @test */
    public function absences_are_confined_through_their_pupil()
    {
        $this->actingAs($this->staffWithRole('directeur'));
        $primaryAbsence = Absence::factory()->create([
            'eleve_id' => $this->primaryPupil->id,
            'ecole_id' => $this->school->id,
        ]);
        $secondaryAbsence = Absence::factory()->create([
            'eleve_id' => $this->secondaryPupil->id,
            'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($this->staffWithRole('directeurS'));

        // Two hops: absence -> pupil -> class -> cycle.
        $absences = Absence::all();
        $this->assertCount(1, $absences);
        $this->assertSame($secondaryAbsence->id, $absences->first()->id);
        $this->assertNull(Absence::find($primaryAbsence->id));
    }

    /* ─── Writes, which a read scope does nothing about ───────────────── */

    /** @test */
    public function a_cycle_head_cannot_enrol_a_pupil_into_another_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        $this->expectException(OutsideCycleException::class);

        Eleve::factory()->forSchool($this->school)->create([
            'class_id' => $this->secondary->id,
        ]);
    }

    /** @test */
    public function a_cycle_head_cannot_move_a_pupil_out_of_their_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        $pupil = Eleve::find($this->primaryPupil->id);
        $this->assertNotNull($pupil);

        $this->expectException(OutsideCycleException::class);

        $pupil->update(['class_id' => $this->secondary->id]);
    }

    /** @test */
    public function a_cycle_head_cannot_create_a_class_in_another_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurM'));

        $this->expectException(OutsideCycleException::class);

        Classes::create([
            'nom_classe'       => '6ème A',
            'categorie_classe' => Cycles::SECONDARY,
            'ecole_id'         => $this->school->id,
        ]);
    }

    /** @test */
    public function a_cycle_head_cannot_record_a_mark_for_another_cycles_pupil()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        $this->expectException(OutsideCycleException::class);

        Notes::factory()->create([
            'eleve_id'  => $this->secondaryPupil->id,
            'classe_id' => $this->secondary->id,
            'ecole_id'  => $this->school->id,
            'periode'   => 'Semestre 1',
        ]);
    }

    /** @test */
    public function a_cycle_head_can_still_work_inside_their_own_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        // The boundary must not make the role useless: everything inside the
        // cycle stays writable.
        $pupil = Eleve::factory()->forSchool($this->school)->create([
            'class_id' => $this->primary->id,
        ]);
        $this->assertNotNull($pupil->id);

        $class = Classes::create([
            'nom_classe'       => 'CM2 B',
            'categorie_classe' => Cycles::PRIMARY,
            'ecole_id'         => $this->school->id,
        ]);
        $this->assertNotNull($class->id);

        $mark = Notes::factory()->create([
            'eleve_id'  => $pupil->id,
            'classe_id' => $this->primary->id,
            'ecole_id'  => $this->school->id,
            'periode'   => 'Semestre 1',
        ]);
        $this->assertNotNull($mark->id);
    }

    /** @test */
    public function editing_an_inherited_record_without_touching_its_class_is_allowed()
    {
        $this->actingAs($this->staffWithRole('directeurP'));

        $pupil = Eleve::find($this->primaryPupil->id);

        // Correcting a field that has nothing to do with the cycle must not be
        // refused just because the record predates the boundary.
        $pupil->update(['lieu_naissance' => 'Porto-Novo']);

        $this->assertSame('Porto-Novo', $pupil->fresh()->lieu_naissance);
    }

    /* ─── Everyone else is untouched ──────────────────────────────────── */

    /** @test */
    public function the_general_head_still_sees_every_cycle()
    {
        $this->actingAs($this->staffWithRole('directeur'));

        $this->assertCount(2, Classes::all());
        $this->assertCount(2, Eleve::all());
    }

    /** @test */
    public function a_teacher_a_bursar_and_a_supervisor_are_not_confined()
    {
        foreach (['enseignant', 'comptable', 'surveillant', 'censeur', 'secretaire'] as $role) {
            $this->actingAs($this->staffWithRole($role));

            $this->assertCount(
                2,
                Classes::all(),
                "Le rôle {$role} ne devrait pas être cloisonné par cycle"
            );
        }
    }

    /** @test */
    public function a_platform_super_admin_is_not_confined()
    {
        $admin = User::factory()->create([
            'role'     => 'super-admin',
            'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($admin);

        $this->assertCount(2, Classes::all());
    }

    /* ─── The memoised boundary must not outlive its owner ───────────── */

    /** @test */
    public function switching_identity_does_not_inherit_the_previous_cycle()
    {
        $this->actingAs($this->staffWithRole('directeurP'));
        $this->assertCount(1, Classes::all());

        // Same PHP process, new identity. Without the Authenticated listener
        // flushing the memoised boundary, the general head would inherit the
        // primary cycle and see one class instead of two.
        $this->actingAs($this->staffWithRole('directeur'));
        $this->assertCount(2, Classes::all());

        $this->actingAs($this->staffWithRole('directeurS'));
        $this->assertCount(1, Classes::all());
        $this->assertSame($this->secondary->id, Classes::first()->id);
    }

    /** @test */
    public function the_boundary_resolves_the_cycle_from_the_role()
    {
        $this->actingAs($this->staffWithRole('directeurM'));
        $this->assertSame(Cycles::KINDERGARTEN, CycleAccess::cycle());
        $this->assertTrue(CycleAccess::isRestricted());

        $this->actingAs($this->staffWithRole('directeur'));
        $this->assertNull(CycleAccess::cycle());
        $this->assertFalse(CycleAccess::isRestricted());
        // Unrestricted means no class list to compare against, not an empty one.
        $this->assertNull(CycleAccess::classIds());
    }

    /* ─── Through the real HTTP path ──────────────────────────────────── */

    /** @test */
    public function the_classes_endpoint_returns_only_the_callers_cycle()
    {
        // Model-level scoping proves the query; this proves the whole path —
        // middleware, route, controller, serialisation.
        $payload = $this->actingAs($this->staffWithRole('directeurP'))
            ->getJson('/api/classes')
            ->assertStatus(200)
            ->json();

        $ids = collect(data_get($payload, 'data', $payload))->pluck('id')->filter()->all();

        $this->assertContains($this->primary->id, $ids);
        $this->assertNotContains($this->secondary->id, $ids);
    }

    /** @test */
    public function the_pupils_endpoint_returns_only_the_callers_cycle()
    {
        $payload = $this->actingAs($this->staffWithRole('directeurS'))
            ->getJson('/api/eleves')
            ->assertStatus(200)
            ->json();

        $ids = collect(data_get($payload, 'data.data', data_get($payload, 'data', $payload)))
            ->pluck('id')->filter()->all();

        $this->assertContains($this->secondaryPupil->id, $ids);
        $this->assertNotContains($this->primaryPupil->id, $ids);
    }

    /** @test */
    public function the_general_head_still_gets_both_cycles_over_http()
    {
        $payload = $this->actingAs($this->staffWithRole('directeur'))
            ->getJson('/api/classes')
            ->assertStatus(200)
            ->json();

        $ids = collect(data_get($payload, 'data', $payload))->pluck('id')->filter()->all();

        $this->assertContains($this->primary->id, $ids);
        $this->assertContains($this->secondary->id, $ids);
    }

    /** @test */
    public function fetching_another_cycles_pupil_by_id_answers_404_not_403()
    {
        // Same reasoning as a cross-school read: the scope makes the record
        // invisible, so route-model binding cannot resolve it. A 403 would
        // confirm the pupil exists.
        $this->actingAs($this->staffWithRole('directeurP'))
            ->getJson("/api/eleves/{$this->secondaryPupil->id}")
            ->assertStatus(404);
    }

    /** @test */
    public function a_write_outside_the_cycle_answers_403_over_http()
    {
        $response = $this->actingAs($this->staffWithRole('directeurM'))
            ->postJson('/api/classes/store', [
                'nom_classe'       => '6ème A',
                'categorie_classe' => Cycles::SECONDARY,
            ]);

        // 403, not a 500 leaking the exception: OutsideCycleException renders
        // itself, and the message names the cycle so the UI can say something
        // true.
        $response->assertStatus(403);
        $this->assertStringContainsString('Maternelle', $response->json('message'));
    }

    /* ─── Cycle sits inside school, never across ──────────────────────── */

    /** @test */
    public function the_cycle_boundary_does_not_reach_into_another_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        $this->actingAs(User::factory()->create([
            'role'     => 'directeur',
            'ecole_id' => $otherSchool->id,
        ]));
        $theirPrimary = Classes::factory()->create([
            'ecole_id'         => $otherSchool->id,
            'categorie_classe' => Cycles::PRIMARY,
        ]);

        // Same cycle, different school: the tenant scope must still win.
        $this->actingAs($this->staffWithRole('directeurP'));

        $this->assertCount(1, Classes::all());
        $this->assertSame($this->primary->id, Classes::first()->id);
        $this->assertNull(Classes::find($theirPrimary->id));
    }
}
