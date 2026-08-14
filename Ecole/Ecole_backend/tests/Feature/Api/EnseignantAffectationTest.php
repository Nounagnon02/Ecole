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
 * Affectations classe × série × matière des enseignants.
 *
 * Le pivot `enseignant_matiere` porte désormais `ecole_id` (lignes historiques
 * null incluses) et sert de source unique de vérité pour l'espace enseignant
 * (notes, classes). Couvre : liste, enregistrement, retrait, règle de
 * cohérence série/matière, cloisonnement inter-écoles, notes filtrées sur les
 * paires exactes, et le contrat Maternelle/Primaire.
 */
class EnseignantAffectationTest extends TestCase
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

    /* ─── Liste des affectations ───────────────────────────────────────── */

    /** @test */
    public function director_lists_teacher_affectations_with_labels()
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

        $this->getJson("/api/enseignants/{$enseignant->id}/affectations")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.classe.nom_classe', $classe->nom_classe)
            ->assertJsonPath('data.0.serie.nom', $serie->nom)
            ->assertJsonPath('data.0.matiere.nom', $matiere->nom);
    }

    /** @test */
    public function listing_affectations_of_unknown_teacher_returns_404()
    {
        $this->actingInSchool();

        $this->getJson('/api/enseignants/99999/affectations')
            ->assertStatus(404);
    }

    /* ─── Enregistrement des affectations ──────────────────────────────── */

    /** @test */
    public function director_records_affectations_with_school_ownership()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $this->postJson("/api/enseignants/{$enseignant->id}/affectations", [
            'affectations' => [[
                'classe_id'  => $classe->id,
                'serie_id'   => $serie->id,
                'matiere_id' => $matiere->id,
            ]],
        ])->assertStatus(201)
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
    public function recording_the_same_triplet_is_idempotent()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $payload = ['affectations' => [[
            'classe_id'  => $classe->id,
            'serie_id'   => $serie->id,
            'matiere_id' => $matiere->id,
        ]]];

        $this->postJson("/api/enseignants/{$enseignant->id}/affectations", $payload)
            ->assertStatus(201);
        $this->postJson("/api/enseignants/{$enseignant->id}/affectations", $payload)
            ->assertStatus(201);

        $this->assertSame(1, EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('enseignant_id', $enseignant->id)
            ->count());
    }

    /** @test */
    public function affectation_rejects_a_matiere_not_attached_to_the_class_serie()
    {
        $school = $this->actingInSchool();
        [$classe, $serie] = $this->secondaireSetup($school);
        // Matière d'une autre série, jamais rattachée à (classe, série).
        $autreMatiere = Matieres::factory()->create(['ecole_id' => $school->id]);
        $enseignant = $this->creerEnseignant($school);

        $this->postJson("/api/enseignants/{$enseignant->id}/affectations", [
            'affectations' => [[
                'classe_id'  => $classe->id,
                'serie_id'   => $serie->id,
                'matiere_id' => $autreMatiere->id,
            ]],
        ])->assertStatus(422);

        $this->assertDatabaseMissing('enseignant_matiere', [
            'enseignant_id' => $enseignant->id,
            'matiere_id'    => $autreMatiere->id,
        ]);
    }

    /** @test */
    public function affectation_rejects_resources_from_another_school()
    {
        $school = $this->actingInSchool();
        $enseignant = $this->creerEnseignant($school);

        // École voisine : sa classe n'appartient pas à l'école du directeur.
        $otherSchool = Ecole::factory()->create();
        [$otherClasse, $otherSerie, $otherMatiere] = $this->secondaireSetup($otherSchool);

        $this->postJson("/api/enseignants/{$enseignant->id}/affectations", [
            'affectations' => [[
                'classe_id'  => $otherClasse->id,
                'serie_id'   => $otherSerie->id,
                'matiere_id' => $otherMatiere->id,
            ]],
        ])->assertStatus(422);

        $this->assertDatabaseMissing('enseignant_matiere', [
            'enseignant_id' => $enseignant->id,
        ]);
    }

    /* ─── Retrait d'une affectation ────────────────────────────────────── */

    /** @test */
    public function director_removes_a_teacher_affectation()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $ligne = EnseignantMatiere::create([
            'enseignant_id' => $enseignant->id,
            'classe_id'     => $classe->id,
            'serie_id'      => $serie->id,
            'matiere_id'    => $matiere->id,
        ]);

        $this->deleteJson("/api/enseignants/{$enseignant->id}/affectations/{$ligne->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('enseignant_matiere', ['id' => $ligne->id]);
    }

    /** @test */
    public function removing_an_unknown_affectation_returns_404()
    {
        $school = $this->actingInSchool();
        $enseignant = $this->creerEnseignant($school);

        $this->deleteJson("/api/enseignants/{$enseignant->id}/affectations/99999")
            ->assertStatus(404);
    }

    /* ─── Enseignants d'une classe ─────────────────────────────────────── */

    /** @test */
    public function class_lists_its_teachers_with_matiere_and_serie()
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

        $this->getJson("/api/classes/{$classe->id}/enseignants")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.enseignant.user.name', $enseignant->user->name)
            ->assertJsonPath('data.0.matiere.nom', $matiere->nom)
            ->assertJsonPath('data.0.serie.nom', $serie->nom);
    }

    /* ─── Notes filtrées sur les paires exactes ────────────────────────── */

    /** @test */
    public function teacher_notes_are_limited_to_their_exact_pairs()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere1] = $this->secondaireSetup($school);
        $matiere2 = Matieres::factory()->create(['ecole_id' => $school->id]);
        $serie->matieres()->attach($matiere2->id, ['classe_id' => $classe->id]);

        $enseignant = $this->creerEnseignant($school);
        EnseignantMatiere::create([
            'enseignant_id' => $enseignant->id,
            'classe_id'     => $classe->id,
            'serie_id'      => $serie->id,
            'matiere_id'    => $matiere1->id,
        ]);

        // Un collègue enseigne la seconde matière dans la même classe.
        $collegue = $this->creerEnseignant($school);
        EnseignantMatiere::create([
            'enseignant_id' => $collegue->id,
            'classe_id'     => $classe->id,
            'serie_id'      => $serie->id,
            'matiere_id'    => $matiere2->id,
        ]);

        $eleve = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);

        $noteMatiere1 = Notes::factory()->create([
            'ecole_id'   => $school->id,
            'eleve_id'   => $eleve->id,
            'classe_id'  => $classe->id,
            'matiere_id' => $matiere1->id,
        ]);
        // Note du collègue : présente dans la classe, mais pas sur l'affectation.
        Notes::factory()->create([
            'ecole_id'   => $school->id,
            'eleve_id'   => $eleve->id,
            'classe_id'  => $classe->id,
            'matiere_id' => $matiere2->id,
        ]);

        $this->actingAs($enseignant->user);

        $this->getJson('/api/enseignant/notes')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $noteMatiere1->id);
    }

    /** @test */
    public function teacher_without_affectation_gets_no_notes()
    {
        $school = $this->actingInSchool();
        [$classe, $serie, $matiere] = $this->secondaireSetup($school);
        $enseignant = $this->creerEnseignant($school);

        $eleve = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        Notes::factory()->create([
            'ecole_id'   => $school->id,
            'eleve_id'   => $eleve->id,
            'classe_id'  => $classe->id,
            'matiere_id' => $matiere->id,
        ]);

        $this->actingAs($enseignant->user);

        $this->getJson('/api/enseignant/notes')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    /* ─── Maternelle / Primaire ────────────────────────────────────────── */

    private function creerMp(Ecole $school, Classes $classe): EnseignantsMaternellePrimaire
    {
        return EnseignantsMaternellePrimaire::create([
            'user_id'  => User::factory()->create([
                'role'     => 'enseignant',
                'ecole_id' => $school->id,
            ])->id,
            'classe_id' => $classe->id,
            'ecole_id' => $school->id,
        ]);
    }

    /** @test */
    public function mp_teachers_are_listed_with_their_class()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'primaire',
        ]);
        $this->creerMp($school, $classe);

        $this->getJson('/api/enseignants-mp')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.classe.nom_classe', $classe->nom_classe);
    }

    /** @test */
    public function director_moves_a_mp_teacher_to_another_class()
    {
        $school = $this->actingInSchool();
        $classeA = Classes::factory()->create(['ecole_id' => $school->id]);
        $classeB = Classes::factory()->create(['ecole_id' => $school->id]);
        $mp = $this->creerMp($school, $classeA);

        $this->postJson("/api/enseignants-mp/{$mp->id}/affectation", [
            'classe_id' => $classeB->id,
        ])->assertStatus(201)
          ->assertJsonPath('success', true)
          ->assertJsonPath('data.classe.id', $classeB->id);

        $this->assertDatabaseHas('enseignants_maternelle_primaire', [
            'id'        => $mp->id,
            'classe_id' => $classeB->id,
        ]);
    }

    /** @test */
    public function mp_affectation_rejects_a_class_from_another_school()
    {
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        $mp = $this->creerMp($school, $classe);

        $otherSchool = Ecole::factory()->create();
        $otherClasse = Classes::factory()->create(['ecole_id' => $otherSchool->id]);

        $this->postJson("/api/enseignants-mp/{$mp->id}/affectation", [
            'classe_id' => $otherClasse->id,
        ])->assertStatus(422);

        $this->assertDatabaseHas('enseignants_maternelle_primaire', [
            'id'        => $mp->id,
            'classe_id' => $classe->id,
        ]);
    }
}
