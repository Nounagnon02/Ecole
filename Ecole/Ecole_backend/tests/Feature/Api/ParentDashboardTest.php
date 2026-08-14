<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Contrat de l'API parent enrichie (lot C).
 *
 * - `/dashboard/parent` doit répondre au contrat du frontend : `enfants`
 *   (avec nom, prenom, classe, moyenne, rang) enrichis de la filiation
 *   (`role`, `is_primary`, `is_guardian`), `stats`, `evolution`,
 *   `communications` — et garder `children` en alias pour l'application
 *   mobile.
 * - `/parent/enfants` expose la même filiation enrichie par enfant.
 * - Un parent ne voit que ses enfants, jamais ceux d'une autre famille.
 */
class ParentDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function school(): Ecole
    {
        return Ecole::factory()->create(['status' => 'active']);
    }

    private function classe(Ecole $school, string $nom): Classes
    {
        return Classes::factory()->create([
            'ecole_id'  => $school->id,
            'nom_classe' => $nom,
        ]);
    }

    private function child(Ecole $school, Classes $classe): Eleve
    {
        return Eleve::factory()->forSchool($school)->create([
            'classe_id' => $classe->id,
        ]);
    }

    private function parent(Ecole $school): UserParent
    {
        return UserParent::factory()->forSchool($school)->create();
    }

    /** Authentifie l'utilisateur du parent (même école, cf. scope tenant). */
    private function actingAsParent(UserParent $parent): User
    {
        $user = $parent->user;
        $this->actingAs($user);
        return $user;
    }

    /** @test */
    public function dashboard_parent_returns_the_frontend_contract_with_enriched_filiation()
    {
        $school = $this->school();
        $classe = $this->classe($school, '6e A');

        $parent = $this->parent($school);
        $child1 = $this->child($school, $classe);
        $child2 = $this->child($school, $classe);

        // Filiation enrichie : le premier est le contact de référence.
        $parent->eleves()->attach($child1->id, ['role' => 'père', 'is_primary' => true, 'is_guardian' => true]);
        $parent->eleves()->attach($child2->id, ['role' => 'mère']);

        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $child1->id, 'classe_id' => $classe->id, 'note' => 14]);
        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $child1->id, 'classe_id' => $classe->id, 'note' => 12]);

        $this->actingAsParent($parent);

        $response = $this->getJson('/api/dashboard/parent');
        $response->assertStatus(200);

        $data = $response->json('data');

        // Contrat frontend : la clé principale est `enfants`.
        $this->assertCount(2, $data['enfants']);
        $this->assertArrayHasKey('nom', $data['enfants'][0]);
        $this->assertArrayHasKey('prenom', $data['enfants'][0]);
        $this->assertArrayHasKey('classe', $data['enfants'][0]);
        $this->assertArrayHasKey('moyenne', $data['enfants'][0]);
        $this->assertArrayHasKey('rang', $data['enfants'][0]);

        // Filiation enrichie exposée.
        $child1Row = collect($data['enfants'])->firstWhere('id', $child1->id);
        $this->assertSame('père', $child1Row['role']);
        $this->assertTrue($child1Row['is_primary']);
        $this->assertTrue($child1Row['is_guardian']);
        $this->assertSame('père', $child1Row['filiation']['role']);
        $this->assertTrue($child1Row['filiation']['is_primary']);

        $child2Row = collect($data['enfants'])->firstWhere('id', $child2->id);
        $this->assertSame('mère', $child2Row['role']);
        $this->assertFalse($child2Row['is_primary']);

        // Moyenne et rang calculés sur les notes réelles.
        $this->assertSame(13, $child1Row['moyenne']);
        $this->assertNotNull($child1Row['rang']);

        // Alias mobile conservé.
        $this->assertSame('père', collect($data['children'])->firstWhere('id', $child1->id)['role']);

        // Stats / évolution / communications du dashboard.
        $this->assertCount(4, $data['stats']);
        $this->assertSame('Enfants Scolarisés', $data['stats'][0]['title']);
        $this->assertSame(2, $data['stats'][0]['value']);
        $this->assertIsArray($data['evolution']);
        $this->assertIsArray($data['communications']);
    }

    /** @test */
    public function parent_sees_only_their_own_children()
    {
        $school = $this->school();
        $classe = $this->classe($school, '6e A');

        $parent    = $this->parent($school);
        $otherParent = $this->parent($school);

        $mine  = $this->child($school, $classe);
        $theirs = $this->child($school, $classe);

        $parent->eleves()->attach($mine->id, ['role' => 'père', 'is_primary' => true]);
        $otherParent->eleves()->attach($theirs->id, ['role' => 'mère', 'is_primary' => true]);

        $this->actingAsParent($parent);

        $this->getJson('/api/dashboard/parent')
            ->assertStatus(200)
            ->assertJsonPath('data.enfants.0.id', $mine->id)
            ->assertJsonCount(1, 'data.enfants');

        $this->getJson('/api/parent/enfants')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /** @test */
    public function parent_children_endpoint_exposes_filiation_and_rank()
    {
        $school = $this->school();
        $classe = $this->classe($school, '3e A');

        $parent = $this->parent($school);
        $child  = $this->child($school, $classe);

        $parent->eleves()->attach($child->id, ['role' => 'tuteur', 'is_guardian' => true]);

        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $child->id, 'classe_id' => $classe->id, 'note' => 16]);
        Notes::factory()->create(['ecole_id' => $school->id, 'eleve_id' => $child->id, 'classe_id' => $classe->id, 'note' => 14]);

        $this->actingAsParent($parent);

        $this->getJson('/api/parent/enfants')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', $child->id)
            ->assertJsonPath('data.0.role', 'tuteur')
            ->assertJsonPath('data.0.is_guardian', true)
            ->assertJsonPath('data.0.is_primary', false)
            ->assertJsonPath('data.0.rang', 1)
            ->assertJsonPath('data.0.moyenne_generale', 15);
    }
}
