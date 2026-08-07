<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\PaiementEleve;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Liaisons parent–enfant (lot A).
 *
 * - A1 : les endpoints qui lient un parent à des élèves doivent refuser tout
 *   élève d'un autre établissement (`school_exists`) — l'ancien `update()`
 *   n'avait aucune règle sur `eleve_ids`.
 * - A2 : l'emploi du temps d'un enfant doit être filtré sur `classe_id`, la
 *   colonne réelle (l'ancien `$child->class_id` visait une colonne absente).
 * - A3 : `paiements.parents_id` doit toujours nommer un parent réellement lié
 *   à l'élève — dérivé du dossier s'il n'est pas fourni, refusé s'il désigne
 *   une autre famille.
 */
class ParentChildLinkTest extends TestCase
{
    use RefreshDatabase;

    private function school(): Ecole
    {
        return Ecole::factory()->create(['status' => 'active']);
    }

    private function director(Ecole $school): User
    {
        return User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);
    }

    private function parent(Ecole $school): UserParent
    {
        return UserParent::factory()->forSchool($school)->create();
    }

    /* ─── A1 : la filiation reste dans l'établissement ───────────────── */

    /** @test */
    public function linking_a_child_of_another_school_is_refused()
    {
        $mine   = $this->school();
        $theirs = $this->school();

        $parent = $this->parent($mine);
        $theirsChild = Eleve::factory()->forSchool($theirs)->create();

        $this->actingAs($this->director($mine))
            ->putJson("/api/parents/{$parent->id}/eleves", [
                'eleve_ids' => [$theirsChild->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('eleve_ids.0');

        // La contrainte s'applique aussi à `PUT /parents/{id}` (ancien trou).
        $this->actingAs($this->director($mine))
            ->putJson("/api/parents/{$parent->id}", [
                'eleve_ids' => [$theirsChild->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('eleve_ids.0');
    }

    /** @test */
    public function linking_own_school_children_works_and_is_stable()
    {
        $mine = $this->school();

        $parent = $this->parent($mine);
        $childA = Eleve::factory()->forSchool($mine)->create();
        $childB = Eleve::factory()->forSchool($mine)->create();

        $this->actingAs($this->director($mine))
            ->putJson("/api/parents/{$parent->id}/eleves", [
                'eleve_ids' => [$childA->id, $childB->id],
            ])
            ->assertStatus(200);

        $this->assertSame(
            [$childA->id, $childB->id],
            $parent->fresh()->eleves()->pluck('eleves.id')->sort()->values()->all()
        );
    }

    /** @test */
    public function re_linking_replaces_the_previous_children()
    {
        $mine = $this->school();

        $parent = $this->parent($mine);
        $childA = Eleve::factory()->forSchool($mine)->create();
        $childB = Eleve::factory()->forSchool($mine)->create();
        $parent->eleves()->attach($childB->id);

        $this->actingAs($this->director($mine))
            ->putJson("/api/parents/{$parent->id}/eleves", ['eleve_ids' => [$childA->id]])
            ->assertStatus(200);

        $this->assertSame(
            [$childA->id],
            $parent->fresh()->eleves()->pluck('eleves.id')->all()
        );
    }

    /* ─── A2 : l'emploi du temps filtre sur la classe réelle ─────────── */

    /** @test */
    public function a_parent_reads_their_childs_timetable_from_the_real_class_column()
    {
        $school = $this->school();
        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'Secondaire',
        ]);

        $child = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $parent = $this->parent($school);
        $parent->eleves()->attach($child->id);

        $slot = EmploiDuTemps::create([
            'ecole_id'      => $school->id,
            'classe_id'     => $classe->id,
            'matiere_id'    => \App\Models\Matieres::factory()->create(['ecole_id' => $school->id])->id,
            'enseignant_id' => \App\Models\Enseignant::factory()->forSchool($school)->create()->id,
            'jour'          => 'lundi',
            'heure_debut'   => '08:00',
            'heure_fin'     => '09:00',
            'salle'         => 'A1',
        ]);

        // Avant la correction, `$child->class_id` (colonne absente) rendait
        // cette requête vide pour tous les enfants.
        $this->actingAs($parent->user)
            ->getJson("/api/parent/enfants/{$child->id}/emploi-du-temps")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $slot->id)
            ->assertJsonPath('data.0.classe_id', $classe->id);
    }

    /* ─── A3 : le règlement nomme le parent du dossier ───────────────── */

    /** @test */
    public function a_payment_without_parent_uses_the_childs_responsible_parent()
    {
        $school = $this->school();
        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'Secondaire',
        ]);
        $child  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $parent = $this->parent($school);
        $parent->eleves()->attach($child->id);

        $response = $this->actingAs($accountant)
            ->postJson('/api/comptable/paiements', [
                'eleve_id'      => $child->id,
                'montant'       => 50000,
                'type_paiement' => 'Scolarité',
                'mode_paiement' => 'ESPECES',
                'date_paiement' => now()->toDateString(),
            ])
            ->assertStatus(201);

        $this->assertSame(
            $parent->id,
            PaiementEleve::findOrFail($response->json('data.id'))->parents_id
        );
    }

    /** @test */
    public function a_payment_for_an_unrelated_parent_is_refused()
    {
        $school = $this->school();
        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'Secondaire',
        ]);
        $child  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $otherParent = $this->parent($school);
        $otherChild  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $otherParent->eleves()->attach($otherChild->id);

        // Le parent existe et est dans la même école, mais il n'est pas lié à
        // cet élève : le règlement ne doit pas lui être imputé.
        $this->actingAs($accountant)
            ->postJson('/api/comptable/paiements', [
                'eleve_id'      => $child->id,
                'montant'       => 50000,
                'type_paiement' => 'Scolarité',
                'mode_paiement' => 'ESPECES',
                'date_paiement' => now()->toDateString(),
                'parents_id'    => $otherParent->id,
            ])
            ->assertStatus(422);
    }

    /** @test */
    public function a_payment_with_the_childrens_parent_still_passes()
    {
        $school = $this->school();
        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        $classe = Classes::factory()->create([
            'ecole_id'         => $school->id,
            'categorie_classe' => 'Secondaire',
        ]);
        $child  = Eleve::factory()->forSchool($school)->create(['classe_id' => $classe->id]);
        $parent = $this->parent($school);
        $parent->eleves()->attach($child->id);

        $response = $this->actingAs($accountant)
            ->postJson('/api/comptable/paiements', [
                'eleve_id'      => $child->id,
                'montant'       => 50000,
                'type_paiement' => 'Scolarité',
                'mode_paiement' => 'ESPECES',
                'date_paiement' => now()->toDateString(),
                'parents_id'    => $parent->id,
            ])
            ->assertStatus(201);

        $this->assertSame(
            $parent->id,
            PaiementEleve::findOrFail($response->json('data.id'))->parents_id
        );
    }
}