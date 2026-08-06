<?php

namespace Tests\Feature\Api;

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Un élève se retire des effectifs, il ne s'efface pas.
 *
 * `EleveController::destroy` faisait `$eleve->delete()` puis `$user->delete()`,
 * deux suppressions dures, et 18 tables cascadaient sur `eleves.id`. Un appel
 * effaçait le dossier scolaire complet d'une personne : notes, absences,
 * paiements, moyennes, dossier médical, vaccinations, emprunts, bourses,
 * certificats, rendez-vous, inscriptions aux examens.
 *
 * Le pendant de `SchoolDeactivationTest`, un cran plus bas — et pour la même
 * raison : un dossier scolaire est précisément ce qu'un établissement doit
 * pouvoir relire des années plus tard, pour un certificat, un relevé ou un
 * litige.
 */
class StudentDeactivationTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Eleve $pupil;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->actingAs($this->schoolHead());

        $classe = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => 'Primaire',
        ]);

        $this->pupil = Eleve::factory()->forSchool($this->school)
            ->create(['class_id' => $classe->id]);
    }

    private function schoolHead(): User
    {
        return User::factory()->create([
            'role'     => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
    }

    /** Un dossier scolaire minimal, pour vérifier qu'il survit. */
    private function giveSchoolRecord(): array
    {
        $mark = Notes::factory()->create([
            'eleve_id'  => $this->pupil->id,
            'classe_id' => $this->pupil->class_id,
            'ecole_id'  => $this->school->id,
            'note'      => 14,
            'periode'   => 'Trimestre 1',
        ]);

        $absence = Absence::factory()->create([
            'eleve_id' => $this->pupil->id,
            'ecole_id' => $this->school->id,
        ]);

        return [$mark, $absence];
    }

    /* ─── La base refuse de perdre un dossier ─────────────────────────── */

    /** @test */
    public function supprimer_un_eleve_qui_porte_un_dossier_est_refuse_par_la_base()
    {
        $this->giveSchoolRecord();

        // SQLite n'applique les clés étrangères que si on le lui demande.
        DB::statement('PRAGMA foreign_keys = ON');

        $this->expectException(\Illuminate\Database\QueryException::class);

        // La suppression dure doit échouer, pas emporter le dossier.
        DB::table('eleves')->where('id', $this->pupil->id)->delete();
    }

    /* ─── DELETE désactive au lieu d'effacer ──────────────────────────── */

    /** @test */
    public function retirer_un_eleve_conserve_son_dossier_et_son_compte()
    {
        [$mark, $absence] = $this->giveSchoolRecord();
        $userId = $this->pupil->user_id;

        $this->actingAs($this->schoolHead())
            ->postJson("/api/eleves/{$this->pupil->id}/deactivate")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSame(Eleve::INACTIVE, $this->pupil->fresh()->statut);

        // Tout est encore là : la fiche, le compte, et le dossier.
        $this->assertDatabaseHas('eleves', ['id' => $this->pupil->id]);
        $this->assertDatabaseHas('users', ['id' => $userId]);
        $this->assertDatabaseHas('notes', ['id' => $mark->id]);
        $this->assertDatabaseHas('absences', ['id' => $absence->id]);
    }

    /** @test */
    public function le_compte_perd_son_acces_sans_etre_supprime()
    {
        $userId = $this->pupil->user_id;

        $this->actingAs($this->schoolHead())
            ->postJson("/api/eleves/{$this->pupil->id}/deactivate")
            ->assertStatus(200);

        // `is_active` à false, et non une suppression : effacer le compte
        // supprimerait l'identité de connexion et orphelinerait ce que la
        // personne a publié.
        $this->assertDatabaseHas('users', ['id' => $userId, 'is_active' => false]);
    }

    /** @test */
    public function un_eleve_peut_etre_retire_puis_reinscrit()
    {
        $head = $this->schoolHead();

        $this->actingAs($head)
            ->postJson("/api/eleves/{$this->pupil->id}/deactivate")
            ->assertStatus(200);
        $this->assertSame(Eleve::INACTIVE, $this->pupil->fresh()->statut);

        $this->actingAs($head)
            ->postJson("/api/eleves/{$this->pupil->id}/activate")
            ->assertStatus(200);
        $this->assertSame(Eleve::ACTIVE, $this->pupil->fresh()->statut);
        $this->assertDatabaseHas('users', ['id' => $this->pupil->user_id, 'is_active' => true]);
    }

    /** @test */
    public function la_desactivation_est_idempotente()
    {
        $head = $this->schoolHead();

        foreach ([1, 2] as $_) {
            $this->actingAs($head)
                ->postJson("/api/eleves/{$this->pupil->id}/deactivate")
                ->assertStatus(200);
        }

        $this->assertSame(Eleve::INACTIVE, $this->pupil->fresh()->statut);
    }

    /** @test */
    public function un_eleve_est_actif_a_la_creation()
    {
        // Le défaut de la colonne, pas une valeur que chaque appelant doit
        // penser à passer.
        $this->assertSame(Eleve::ACTIVE, $this->pupil->fresh()->statut);
    }

    /* ─── Qui peut le faire ───────────────────────────────────────────── */

    /** @test */
    public function un_eleve_ne_se_retire_pas_lui_meme()
    {
        $pupilAccount = User::factory()->create([
            'role'     => 'eleve',
            'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($pupilAccount)
            ->postJson("/api/eleves/{$this->pupil->id}/deactivate")
            ->assertStatus(403);

        $this->assertSame(Eleve::ACTIVE, $this->pupil->fresh()->statut);
    }

    /** @test */
    public function un_directeur_de_cycle_ne_retire_pas_un_eleve_dun_autre_cycle()
    {
        $secondary = Classes::factory()->create([
            'ecole_id'         => $this->school->id,
            'categorie_classe' => 'Secondaire',
        ]);
        $secondaryPupil = Eleve::factory()->forSchool($this->school)
            ->create(['class_id' => $secondary->id]);

        $primaryHead = User::factory()->create([
            'role'     => 'directeurP',
            'ecole_id' => $this->school->id,
        ]);

        // La frontière de cycle rend l'élève introuvable : 404, pas 403 — un 403
        // confirmerait son existence.
        $this->actingAs($primaryHead)
            ->postJson("/api/eleves/{$secondaryPupil->id}/deactivate")
            ->assertStatus(404);

        $this->assertSame(Eleve::ACTIVE, $secondaryPupil->fresh()->statut);
    }
}
