<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\EnseignantMatiere;
use App\Models\EnseignantsMaternellePrimaire;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Series;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Contrat HTTP de SeriesController.
 *
 * Avant cet audit, le contrôleur n'avait aucune route : ses ~20 méthodes
 * étaient mortes côté API. Ce test verrouille l'exposition complète (lectures
 * + affectations enseignants), le cloisonnement par rôle sur les écritures et
 * la correction du bug `class_id` → `classe_id` qui faisait échouer
 * getElevesByClasse et getSeriesByClasse.
 */
class SeriesContractTest extends TestCase
{
    use RefreshDatabase;

    /** Classe secondaire + série + matière rattachée, pour une école. */
    private function secondaireSetup(Ecole $school): array
    {
        $classe  = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'secondaire',
        ]);
        $serie   = Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);
        $matiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $serie->matieres()->attach($matiere->id, ['classe_id' => $classe->id]);

        return [$classe, $serie, $matiere];
    }

    private function creerEnseignant(Ecole $school): Enseignant
    {
        return Enseignant::factory()->forSchool($school)->create();
    }

    /* ─── Lectures exposées ────────────────────────────────────────────── */

    /** @test */
    public function series_list_is_exposed()
    {
        $school = $this->actingInSchool();
        Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);
        Series::factory()->create(['ecole_id' => $school->id, 'nom' => '5ème']);

        $this->getJson('/api/series')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.nom', '6ème');
    }

    /** @test */
    public function classes_with_series_are_exposed()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);

        $this->getJson('/api/series/classes')
            ->assertStatus(200)
            ->assertJsonPath('0.id', $classe->id)
            ->assertJsonPath('0.series.0.id', $serie->id);
    }

    /** @test */
    public function all_classes_with_series_and_matieres_are_exposed()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);

        $this->getJson('/api/series/classes-matieres')
            ->assertStatus(200)
            ->assertJsonPath('0.id', $classe->id)
            ->assertJsonPath('0.series.0.matieres.0.id', $matiere->id);
    }

    /** @test */
    public function serie_show_returns_404_for_unknown_serie()
    {
        $this->actingInSchool();

        $this->getJson('/api/series/99999')
            ->assertStatus(404);
    }

    /** @test */
    public function serie_lists_its_eleves_and_matieres()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->getJson("/api/series/{$serie->id}/eleves")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $eleve->id);

        $this->getJson("/api/series/{$serie->id}/matieres")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $matiere->id);
    }

    /* ─── Régression class_id → classe_id ──────────────────────────────── */

    /** @test */
    public function eleves_by_classe_queries_classe_id_not_class_id()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);
        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->getJson("/api/series/{$serie->id}/eleves/classe/{$classe->id}")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $eleve->id);
    }

    /** @test */
    public function series_by_classe_queries_classe_id_not_class_id()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);
        Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->getJson("/api/series/classe/{$classe->id}")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $serie->id);
    }

    /* ─── Écritures réservées à la direction ───────────────────────────── */

    /** @test */
    public function director_creates_and_updates_a_serie()
    {
        $this->actingInSchool();

        $response = $this->postJson('/api/series/store', ['nom' => 'Terminale C'])
            ->assertStatus(201);

        $serieId = $response->json('id');

        $this->postJson("/api/series/update/{$serieId}", ['nom' => 'Terminale D'])
            ->assertStatus(200)
            ->assertJsonPath('nom', 'Terminale D');
    }

    /** @test */
    public function serie_name_must_be_unique_within_the_school()
    {
        $school = $this->actingInSchool();
        Series::factory()->create(['ecole_id' => $school->id, 'nom' => '6ème']);

        $this->postJson('/api/series/store', ['nom' => '6ème'])
            ->assertStatus(422);
    }

    /** @test */
    public function teacher_cannot_create_a_serie()
    {
        $school = $this->actingInSchool(null, 'enseignant');

        $this->postJson('/api/series/store', ['nom' => 'Tle C'])
            ->assertStatus(403);
    }

    /** @test */
    public function director_attaches_and_detaches_a_matiere_with_coefficient()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);
        $autreMatiere = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->postJson("/api/series/{$serie->id}/matieres", [
            'matiere_id'  => $autreMatiere->id,
            'classe_id'   => $classe->id,
            'coefficient' => 3,
        ])->assertStatus(201);

        $this->assertDatabaseHas('serie_matieres', [
            'serie_id'    => $serie->id,
            'matiere_id'  => $autreMatiere->id,
            'classe_id'   => $classe->id,
            'coefficient' => 3,
        ]);

        $this->deleteJson("/api/series/{$serie->id}/matieres/{$autreMatiere->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('serie_matieres', [
            'serie_id'   => $serie->id,
            'matiere_id' => $autreMatiere->id,
        ]);
    }

    /** @test */
    public function director_syncs_matieres_of_a_serie()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $autreMatiere = Matieres::factory()->create(['ecole_id' => $school->id]);

        $this->postJson("/api/series/{$serie->id}/matieres/sync", [
            'matieres' => [[
                'matiere_id'  => $autreMatiere->id,
                'classe_id'   => $classe->id,
                'coefficient' => 2,
            ]],
        ])->assertStatus(200)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('serie_matieres', [
            'serie_id'   => $serie->id,
            'matiere_id' => $autreMatiere->id,
        ]);
        $this->assertDatabaseMissing('serie_matieres', [
            'serie_id'   => $serie->id,
            'matiere_id' => $matiere->id,
        ]);
    }

    /** @test */
    public function director_updates_a_matiere_coefficient_for_a_classe()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);

        $this->putJson("/api/series/{$serie->id}/matieres/{$matiere->id}/coefficient", [
            'classe_id'   => $classe->id,
            'coefficient' => 5,
        ])->assertStatus(200);

        $this->assertDatabaseHas('serie_matieres', [
            'serie_id'    => $serie->id,
            'matiere_id'  => $matiere->id,
            'classe_id'   => $classe->id,
            'coefficient' => 5,
        ]);
    }

    /* ─── Affectations enseignants (classe × série × matière) ──────────── */

    /** @test */
    public function director_assigns_teachers_to_a_matiere_in_a_classe_serie()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $this->postJson("/api/series/classe/{$classe->id}/serie/{$serie->id}/enseignants", [
            'matieres' => [[
                'classe_id'   => $classe->id,
                'serie_id'    => $serie->id,
                'matiere_id'  => $matiere->id,
                'enseignants' => [$enseignant->id],
            ]],
        ])->assertStatus(200)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('enseignant_matiere', [
            'enseignant_id' => $enseignant->id,
            'classe_id'     => $classe->id,
            'serie_id'      => $serie->id,
            'matiere_id'    => $matiere->id,
            'ecole_id'      => $school->id,
        ]);
    }

    /** @test */
    public function teacher_cannot_assign_teachers()
    {
        $school = $this->actingInSchool(null, 'enseignant');
        [$classe, $serie] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $this->postJson("/api/series/classe/{$classe->id}/serie/{$serie->id}/enseignants", [
            'matieres' => [[
                'classe_id'   => $classe->id,
                'serie_id'    => $serie->id,
                'matiere_id'  => 1,
                'enseignants' => [$enseignant->id],
            ]],
        ])->assertStatus(403);
    }

    /** @test */
    public function matieres_of_a_serie_in_a_classe_include_their_enseignants()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        EnseignantMatiere::create([
            'enseignant_id' => $enseignant->id,
            'classe_id'     => $classe->id,
            'serie_id'      => $serie->id,
            'matiere_id'    => $matiere->id,
        ]);

        $this->getJson("/api/series/classe/{$classe->id}/serie/{$serie->id}/matieres")
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $matiere->id)
            ->assertJsonPath('0.enseignants.0.id', $enseignant->id);
    }

    /* ─── Affectations Maternelle / Primaire ───────────────────────────── */

    /** @test */
    public function director_assigns_mp_teachers_to_a_classe()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'primaire',
        ]);
        $classeB = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'primaire',
        ]);
        $mp = EnseignantsMaternellePrimaire::create([
            'user_id'   => User::factory()->create([
                'role'     => 'enseignant',
                'ecole_id' => $school->id,
            ])->id,
            'classe_id' => $classeB->id,
            'ecole_id'  => $school->id,
        ]);

        $this->postJson("/api/series/classe/{$classe->id}/enseignants-mp", [
            'classes' => [[
                'classe_id'   => $classe->id,
                'enseignants' => [$mp->id],
            ]],
        ])->assertStatus(200)
          ->assertJsonPath('success', true);

        // Source de vérité : `classe_id` du profil M/P (l'ancien pivot
        // `enseignantmp_classe` pointe vers la mauvaise table).
        $this->assertDatabaseHas('enseignants_maternelle_primaire', [
            'id'        => $mp->id,
            'classe_id' => $classe->id,
        ]);
    }

    /* ─── Moyenne générale dans une série ──────────────────────────────── */

    /** @test */
    public function moyenne_generale_is_computed_with_coefficients()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);
        Notes::factory()->create([
            'ecole_id'   => $school->id,
            'eleve_id'   => $eleve->id,
            'classe_id'  => $classe->id,
            'matiere_id' => $matiere->id,
            'note'       => 14,
        ]);

        // Coefficient posé par secondaireSetup → 1. Moyenne = 14 / 1.
        $this->getJson("/api/series/{$serie->id}/moyenne/{$eleve->id}")
            ->assertStatus(200)
            ->assertJsonPath('moyenne', 14);
    }

    /** @test */
    public function moyenne_generale_returns_404_when_no_note_exists()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);
        $eleve = Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
            'serie_id'  => $serie->id,
        ]);

        $this->getJson("/api/series/{$serie->id}/moyenne/{$eleve->id}")
            ->assertStatus(404);
    }
}
