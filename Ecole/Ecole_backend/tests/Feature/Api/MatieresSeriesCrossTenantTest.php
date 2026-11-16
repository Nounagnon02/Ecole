<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Coefficients;
use App\Models\Ecole;
use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `MatieresController::attachSeries()` validait `serie_id`/`classe_id` avec
 * `Rule::exists()`, qui interroge la table brute sans le scope `ecole` de
 * `BelongsToEcole`. Un directeur pouvait donc rattacher sa matière à la série
 * ou la classe d'un autre établissement (id deviné ou séquentiel). Corrigé
 * en passant à `school_exists`, déjà utilisé partout ailleurs pour ce type de
 * validation.
 */
class MatieresSeriesCrossTenantTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function attaching_another_schools_serie_is_rejected()
    {
        $school = $this->actingInSchool();
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);

        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignSerie = $this->withoutTenantScope($otherSchool, fn () => Series::factory()->create(['ecole_id' => $otherSchool->id]));

        $this->postJson("/api/matieres/{$matiere->id}/series", [
            'series' => [[
                'serie_id' => $foreignSerie->id,
                'coefficient' => 3,
                'classe_id' => $classe->id,
            ]],
        ])->assertStatus(422);

        $this->assertDatabaseMissing('serie_matieres', [
            'matiere_id' => $matiere->id,
            'serie_id' => $foreignSerie->id,
        ]);
    }

    /** @test */
    public function attaching_another_schools_classe_is_rejected()
    {
        $school = $this->actingInSchool();
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $serie = Series::factory()->create(['ecole_id' => $school->id]);

        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignClasse = $this->withoutTenantScope($otherSchool, fn () => Classes::factory()->create(['ecole_id' => $otherSchool->id]));

        $this->postJson("/api/matieres/{$matiere->id}/series", [
            'series' => [[
                'serie_id' => $serie->id,
                'coefficient' => 3,
                'classe_id' => $foreignClasse->id,
            ]],
        ])->assertStatus(422);

        $this->assertDatabaseMissing('coefficient_matieres', [
            'matiere_id' => $matiere->id,
            'classe_id' => $foreignClasse->id,
        ]);
    }

    private function withoutTenantScope(Ecole $school, callable $callback)
    {
        return \App\Support\SchoolContext::for($school->id, $callback);
    }
}
