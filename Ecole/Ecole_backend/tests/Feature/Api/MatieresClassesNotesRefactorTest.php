<?php

namespace Tests\Feature\Api;

use App\Http\Controllers\MatieresController;
use App\Models\Classes;
use App\Models\Coefficients;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Series;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Refactoring of the matières / classes / notes controllers:
 * unified cycle helpers, série-matière coefficient management, grouped
 * grade entry and grade grid, plus the new volume_horaire / capacite_max
 * columns.
 */
class MatieresClassesNotesRefactorTest extends TestCase
{
    use RefreshDatabase;

    /** A secondaire classe + série + matière linked to it, for one school. */
    private function secondaireSetup(Ecole $school): array
    {
        $classe  = Classes::factory()->create([
            'ecole_id'        => $school->id,
            'categorie_classe' => 'secondaire',
        ]);
        $serie   = Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $serie->matieres()->attach($matiere->id, ['classe_id' => $classe->id]);

        return [$classe, $serie, $matiere];
    }

    /* ─── Matières : affectation série + coefficient ───────────────────── */

    /** @test */
    public function a_matiere_can_be_attached_to_a_serie_with_a_coefficient()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);

        $this->postJson("/api/matieres/{$matiere->id}/series", [
            'series' => [[
                'serie_id'    => $serie->id,
                'coefficient' => 4,
                'classe_id'   => $classe->id,
            ]],
        ])->assertStatus(200)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('serie_matieres', [
            'matiere_id'  => $matiere->id,
            'serie_id'    => $serie->id,
            'coefficient' => 4,
        ]);

        $this->assertDatabaseHas('coefficient_matieres', [
            'matiere_id'  => $matiere->id,
            'serie_id'    => $serie->id,
            'coefficient' => 4,
        ]);
    }

    /** @test */
    public function coefficients_are_listed_for_a_matiere()
    {
        $school = $this->actingInSchool();
        [, $serie, $matiere] = $this->secondaireSetup($school);

        Coefficients::create([
            'matiere_id'  => $matiere->id,
            'serie_id'    => $serie->id,
            'classe_id'   => null,
            'coefficient' => 3,
            'ecole_id'    => $school->id,
        ]);

        $this->getJson("/api/matieres/{$matiere->id}/coefficients")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.coefficient', 3);
    }

    /** @test */
    public function detaching_a_serie_removes_the_pivot_and_the_coefficient()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        Coefficients::create([
            'matiere_id'  => $matiere->id,
            'serie_id'    => $serie->id,
            'classe_id'   => $classe->id,
            'coefficient' => 2,
            'ecole_id'    => $school->id,
        ]);

        $this->deleteJson("/api/matieres/{$matiere->id}/series/{$serie->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('serie_matieres', [
            'matiere_id' => $matiere->id,
            'serie_id'   => $serie->id,
        ]);
        $this->assertDatabaseMissing('coefficient_matieres', [
            'matiere_id' => $matiere->id,
            'serie_id'   => $serie->id,
        ]);
    }

    /* ─── Matières : colonnes et niveau unifié ─────────────────────────── */

    /** @test */
    public function a_matiere_is_stored_with_a_volume_horaire()
    {
        $school = $this->actingInSchool();

        $this->postJson('/api/matieres/store', [
            'nom'            => 'Mathématiques',
            'volume_horaire' => 4,
        ])->assertStatus(201);

        $this->assertDatabaseHas('matieres', [
            'nom'            => 'Mathématiques',
            'volume_horaire' => 4,
            'ecole_id'       => $school->id,
        ]);
    }

    /** @test */
    public function the_unified_cycle_helpers_still_return_their_levels()
    {
        $school = $this->actingInSchool();

        $maternelle = Series::factory()->create(['ecole_id' => $school->id, 'nom' => 'Maternelle 1']);
        $secondaire = Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);
        $classe     = Classes::factory()->create(['ecole_id' => $school->id, 'categorie_classe' => 'Secondaire']);
        $maths = Matieres::factory()->create(['ecole_id' => $school->id, 'nom' => 'Maths']);
        $sport = Matieres::factory()->create(['ecole_id' => $school->id, 'nom' => 'EPS']);
        $maternelle->matieres()->attach($maths->id, ['coefficient' => 1, 'classe_id' => $classe->id]);
        $secondaire->matieres()->attach($sport->id, ['coefficient' => 2, 'classe_id' => $classe->id]);

        $controller = app(MatieresController::class);

        $maternelleJson = json_decode($controller->getMatieresM()->getContent(), true);
        $this->assertTrue($maternelleJson['success']);
        $this->assertTrue(collect($maternelleJson['data'])->pluck('nom')->contains('Maths'));

        $secondaireJson = json_decode($controller->getMatieresS()->getContent(), true);
        $this->assertTrue($secondaireJson['success']);
        $this->assertTrue(collect($secondaireJson['data'])->flatten(1)->pluck('nom')->contains('EPS'));
    }

    /* ─── Classes : capacite_max ───────────────────────────────────────── */

    /** @test */
    public function a_classe_is_stored_with_a_capacite_max()
    {
        $school = $this->actingInSchool();

        $this->postJson('/api/classes/store', [
            'nom_classe'       => '6e A',
            'categorie_classe' => 'Secondaire',
            'capacite_max'     => 40,
        ])->assertStatus(201);

        $this->assertDatabaseHas('classes', [
            'nom_classe'   => '6e A',
            'capacite_max' => 40,
            'ecole_id'     => $school->id,
        ]);
    }

    /* ─── Notes : saisie groupée et grille ─────────────────────────────── */

    /** @test */
    public function bulk_store_creates_notes_for_a_whole_class_in_one_call()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $eleveA = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);
        $eleveB = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->postJson('/api/notes/bulk', [
            'classe_id'       => $classe->id,
            'matiere_id'      => $matiere->id,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => '2026-01-15',
            'periode'         => 'Trimestre 1',
            'notes'           => [
                ['eleve_id' => $eleveA->id, 'note' => 14],
                ['eleve_id' => $eleveB->id, 'note' => 9],
            ],
        ])->assertStatus(201)
          ->assertJsonPath('success', true)
          ->assertJsonPath('count', 2);

        $this->assertSame(2, Notes::where('classe_id', $classe->id)
            ->where('matiere_id', $matiere->id)
            ->count());
    }

    /** @test */
    public function bulk_store_rejects_a_student_who_does_not_belong_to_the_class()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $stranger = Eleve::factory()->forSchool($school)->create(['serie_id' => $serie->id]);

        $this->postJson('/api/notes/bulk', [
            'classe_id'       => $classe->id,
            'matiere_id'      => $matiere->id,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => '2026-01-15',
            'periode'         => 'Trimestre 1',
            'notes'           => [['eleve_id' => $stranger->id, 'note' => 12]],
        ])->assertStatus(400)
          ->assertJsonPath('success', false);

        $this->assertSame(0, Notes::where('classe_id', $classe->id)->count());
    }

    /** @test */
    public function grille_saisie_returns_the_classes_eleves_and_matieres()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->getJson("/api/notes/grille/{$classe->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.classe.id', $classe->id)
            ->assertJsonPath('data.eleves.0.id', $eleve->id)
            ->assertJsonPath('data.matieres.0.id', $matiere->id);
    }
}
