<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\ParentEleve;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Filiation enrichie (lot B).
 *
 * - Le pivot `eleves_parents` est un modèle `ParentEleve` avec `role`,
 *   `is_primary`, `is_guardian` et un scope `primary()`.
 * - Un seul parent primaire par élève (les précédents sont rétrogradés).
 * - `responsibleParent()` préfère le parent primaire au « premier venu ».
 * - L'API `parents` accepte des liens enrichis (`liens`) sans casser la
 *   compatibilité des listes d'ids (`eleve_ids`).
 *
 * Les lectures de relations (`parents()`, `eleves()`) sont vues à travers le
 * scope multi-tenant (`BelongsToEcole`) : chaque test agit donc comme le
 * directeur de l'école concernée, comme en production.
 */
class FiliationTest extends TestCase
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

    private function child(Ecole $school): Eleve
    {
        return Eleve::factory()->forSchool($school)->create();
    }

    /** Authentifie le directeur de l'école (les relations passent par le scope tenant). */
    private function actingIn(Ecole $school): self
    {
        return $this->actingAs($this->director($school));
    }

    /* ─── B : le pivot est un modèle enrichi ──────────────────────────── */

    /** @test */
    public function pivot_links_carry_role_primary_and_guardian()
    {
        $school = $this->school();
        $this->actingIn($school);

        $parent = $this->parent($school);
        $child  = $this->child($school);

        $parent->eleves()->attach($child->id, [
            'role'        => ParentEleve::ROLE_TUTEUR,
            'is_guardian' => true,
        ]);

        $filiation = ParentEleve::where('parent_id', $parent->id)
            ->where('eleve_id', $child->id)
            ->first();

        $this->assertSame(ParentEleve::ROLE_TUTEUR, $filiation->role);
        $this->assertTrue($filiation->is_guardian);
        $this->assertFalse($filiation->is_primary);

        // Le pivot enrichi est exposé sur les relations côté parent comme côté élève.
        $this->assertSame(
            ParentEleve::ROLE_TUTEUR,
            $parent->eleves()->find($child->id)->pivot->role
        );
        $this->assertSame(
            ParentEleve::ROLE_TUTEUR,
            $child->parents()->find($parent->id)->pivot->role
        );
    }

    /** @test */
    public function primary_scope_returns_only_the_reference_parent()
    {
        $school = $this->school();
        $this->actingIn($school);

        $first  = $this->parent($school);
        $second = $this->parent($school);
        $child  = $this->child($school);

        $first->eleves()->attach($child->id);
        $second->eleves()->attach($child->id);

        ParentEleve::setPrimary($child->id, $first->id);
        ParentEleve::setPrimary($child->id, $second->id);

        $primaries = ParentEleve::where('eleve_id', $child->id)
            ->primary()
            ->pluck('parent_id');

        $this->assertSame([$second->id], $primaries->all());

        // L'élève voit bien son contact de référence.
        $this->assertSame($second->id, $child->primaryFiliation()->parent_id);
    }

    /** @test */
    public function an_eleve_has_a_single_primary_parent()
    {
        $school = $this->school();
        $this->actingIn($school);

        $first  = $this->parent($school);
        $second = $this->parent($school);
        $child  = $this->child($school);

        $first->eleves()->attach($child->id);
        $second->eleves()->attach($child->id);

        ParentEleve::setPrimary($child->id, $first->id);
        ParentEleve::setPrimary($child->id, $second->id);

        $this->assertSame(
            1,
            ParentEleve::where('eleve_id', $child->id)->primary()->count()
        );
        $this->assertTrue(
            ParentEleve::where('parent_id', $second->id)
                ->where('eleve_id', $child->id)
                ->first()
                ->is_primary
        );
        $this->assertFalse(
            ParentEleve::where('parent_id', $first->id)
                ->where('eleve_id', $child->id)
                ->first()
                ->is_primary
        );
    }

    /** @test */
    public function responsible_parent_prefers_the_primary_contact()
    {
        $school = $this->school();
        $this->actingIn($school);

        $first  = $this->parent($school);
        $second = $this->parent($school);
        $child  = $this->child($school);

        $first->eleves()->attach($child->id);
        $second->eleves()->attach($child->id);

        // Sans parent désigné : repli sur le premier parent lié.
        $this->assertSame($first->id, $child->responsibleParent()?->id);

        // Le parent primaire prend le dessus.
        ParentEleve::setPrimary($child->id, $second->id);

        $this->assertSame($second->id, $child->responsibleParent()?->id);
    }

    /** @test */
    public function set_eleves_preserves_enriched_rows_on_relink()
    {
        $school = $this->school();
        $this->actingIn($school);

        $parent = $this->parent($school);
        $childA = $this->child($school);
        $childB = $this->child($school);

        $this->putJson("/api/parents/{$parent->id}/eleves", [
            'liens' => [
                ['eleve_id' => $childA->id, 'role' => 'mère', 'is_primary' => true],
                ['eleve_id' => $childB->id, 'role' => 'père'],
            ],
        ])->assertStatus(200);

        // Un re-lien « sans enrichissement » ne doit pas vider les rôles.
        $this->putJson("/api/parents/{$parent->id}/eleves", [
            'liens' => [
                ['eleve_id' => $childA->id],
            ],
        ])->assertStatus(200);

        $roleA = ParentEleve::whereParentId($parent->id)
            ->whereEleveId($childA->id)
            ->first()?->role;

        $this->assertSame('mère', $roleA);
        $this->assertTrue(
            ParentEleve::whereParentId($parent->id)
                ->whereEleveId($childA->id)
                ->first()
                ->is_primary
        );
        $this->assertEmpty(
            ParentEleve::whereParentId($parent->id)->whereEleveId($childB->id)->get()
        );
    }

    /** @test */
    public function set_eleves_designs_a_single_primary_from_entries()
    {
        $school = $this->school();
        $this->actingIn($school);

        $parent = $this->parent($school);
        $child  = $this->child($school);

        $parent->setEleves([
            ['eleve_id' => $child->id, 'role' => 'mère', 'is_primary' => true],
        ]);

        $this->assertTrue(
            ParentEleve::whereParentId($parent->id)
                ->whereEleveId($child->id)
                ->firstOrFail()
                ->is_primary
        );
    }

    /** @test */
    public function api_rejects_unrelated_children_even_through_liens()
    {
        $mine   = $this->school();
        $theirs = $this->school();
        $this->actingIn($mine);

        $parent = $this->parent($mine);
        $theirsChild = $this->child($theirs);

        $this->putJson("/api/parents/{$parent->id}/eleves", [
            'liens' => [
                ['eleve_id' => $theirsChild->id, 'role' => 'tuteur'],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('liens.0.eleve_id');
    }

    /** @test */
    public function invalid_role_is_rejected()
    {
        $school = $this->school();
        $this->actingIn($school);

        $parent = $this->parent($school);
        $child  = $this->child($school);

        $this->putJson("/api/parents/{$parent->id}/eleves", [
            'liens' => [
                ['eleve_id' => $child->id, 'role' => 'cousin'],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('liens.0.role');
    }
}