<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Contributions;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Series;
use App\Models\Sessions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Intégrité des liaisons Eloquent.
 *
 * Régression après l'audit des relations : quatre liaisons étaient cassées
 * (pivot au mauvais nom, clés étrangères inventées, relations inverses
 * orphelines). Ces tests verrouillent le contrat de chacune pour qu'une
 * future refactorisation ne les casse pas en silence.
 */
class RelationIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function matiere_lists_its_eleves_through_eleves_matieres_pivot()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'primaire',
        ]);
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $eleve = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $matiere->eleves()->attach($eleve->id);

        $this->assertDatabaseHas('eleves_matieres', [
            'matieres_id' => $matiere->id,
            'eleves_id'   => $eleve->id,
        ]);
        $this->assertSame(1, $matiere->eleves()->count());
        $this->assertTrue(
            $matiere->eleves()->pluck('eleves.id')->contains($eleve->id),
            'Le pivot attendu est `eleves_matieres` avec les colonnes pluriels matieres_id/eleves_id.'
        );

        // L'inverse (utilisé par SeriesController::getElevesByMatiere) doit
        // résoudre le même pivot, dans l'autre sens.
        $this->assertSame(1, $eleve->matieres()->count());
        $this->assertTrue($eleve->matieres()->pluck('matieres.id')->contains($matiere->id));
    }

    /** @test */
    public function contribution_resolves_its_classe_through_id_classe()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'secondaire',
        ]);
        $serie = Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);
        $contribution = Contributions::create([
            'montant'                        => 5000,
            'date_fin_premiere_tranche'      => now()->addMonth(),
            'montant_premiere_tranche'       => 2000,
            'date_fin_deuxieme_tranche'      => now()->addMonths(2),
            'montant_deuxieme_tranche'       => 1500,
            'date_fin_troisieme_tranche'     => now()->addMonths(3),
            'montant_troisieme_tranche'      => 1500,
            'id_classe'                      => $classe->id,
            'id_serie'                       => $serie->id,
        ]);

        $this->assertNotNull($contribution->classe);
        $this->assertSame($classe->id, $contribution->classe->id);
        // L'inverse déclaré sur Classes doit pointer sur la même colonne.
        $this->assertSame($classe->id, $classe->contributions()->first()->id);
    }

    /** @test */
    public function broken_relations_are_gone_and_their_columns_never_existed()
    {
        // Matieres::classe() ciblait `matieres.class_id`, colonne inexistante.
        $this->assertFalse(Schema::hasColumn('matieres', 'class_id'));
        $this->assertFalse(method_exists(Matieres::class, 'classe'));

        // Sessions::notes() ciblait `notes.session_id`, colonne inexistante.
        $this->assertFalse(Schema::hasColumn('notes', 'session_id'));
        $this->assertFalse(method_exists(Sessions::class, 'notes'));
    }
}
