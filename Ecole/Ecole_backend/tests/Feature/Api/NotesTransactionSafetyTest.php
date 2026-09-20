<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * NotesCrudController — sûreté transactionnelle de `store()`/`update()`.
 *
 * Les trois refus métier (élève hors classe, matière hors série, note hors
 * barème) faisaient un `return` direct depuis l'intérieur du
 * `try { DB::beginTransaction(); ... }` sans jamais appeler `DB::rollBack()`
 * — la transaction restait ouverte. Le `catch` avait en plus le même défaut
 * d'ordre que `AuthController::inscription()` et `PaymentController` :
 * `rethrowIfMeaningful()` avant `DB::rollBack()`.
 */
class NotesTransactionSafetyTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $directeur;
    private Classes $classe;
    private Classes $autreClasse;
    private Matieres $matiere;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
        $this->classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->autreClasse = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $this->matiere = Matieres::factory()->create(['ecole_id' => $this->school->id]);
    }

    /** @test */
    public function assigning_a_student_outside_the_class_does_not_leave_a_transaction_open()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->autreClasse->id]);
        $niveauAvant = DB::transactionLevel();

        $this->actingAs($this->directeur)->postJson('/api/notes/store', [
            'eleve_id' => $eleve->id,
            // L'élève appartient à `autreClasse`, pas à celle-ci.
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'note' => 15,
            'note_sur' => 20,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => now()->format('Y-m-d'),
            'periode' => 'Trimestre 1',
        ])->assertStatus(400);

        $this->assertSame($niveauAvant, DB::transactionLevel());
    }

    /** @test */
    public function a_valid_note_can_still_be_recorded_after_a_refused_one()
    {
        $eleveValide = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->classe->id]);
        $eleveHorsClasse = Eleve::factory()->forSchool($this->school)->create(['classe_id' => $this->autreClasse->id]);

        // Si la transaction du refus précédent était restée ouverte, cette
        // saisie valide échouerait avec un PDOException plutôt qu'un 201.
        $this->actingAs($this->directeur)->postJson('/api/notes/store', [
            'eleve_id' => $eleveHorsClasse->id,
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'note' => 15,
            'note_sur' => 20,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => now()->format('Y-m-d'),
            'periode' => 'Trimestre 1',
        ])->assertStatus(400);

        $this->actingAs($this->directeur)->postJson('/api/notes/store', [
            'eleve_id' => $eleveValide->id,
            'classe_id' => $this->classe->id,
            'matiere_id' => $this->matiere->id,
            'note' => 15,
            'note_sur' => 20,
            'type_evaluation' => 'Devoir1',
            'date_evaluation' => now()->format('Y-m-d'),
            'periode' => 'Trimestre 1',
        ])->assertStatus(201);

        $this->assertDatabaseHas('notes', ['eleve_id' => $eleveValide->id]);
    }
}
