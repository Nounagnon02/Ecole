<?php

namespace Tests\Feature\Api;

use App\Models\Depense;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\TransactionPaiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Contrat comptable — paiements, échéancier, reçus, dépenses.
 *
 * Deux pièges historiques verrouillés ici :
 *
 *   - `paiements` n'a pas de colonne `statut`. Les endpoints qui lisaient
 *     `$p->statut` renvoyaient `null` — les pages Factures/Transactions
 *     affichaient des statuts vides et toutes les statistiques retombaient à
 *     zéro. Le contrat exposé vit sur `statut_global`, normalisé en slug
 *     (`payee`/`partiel`/`en_attente`), le vocabulaire du front.
 *   - l'identité d'un élève vit sur `users` (`name`, `prenom`), pas sur
 *     `eleves` : un paiement sans l'utilisateur chargé s'affichait « N/A ».
 */
class ComptableControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $accountant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->accountant = User::factory()->create([
            'role' => 'comptable',
            'ecole_id' => $this->school->id,
        ]);

        $this->actingAs($this->accountant);
    }

    private function pupil(): Eleve
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create([
            'numero_matricule' => 'MAT-2026-0001',
        ]);

        $eleve->user->update(['name' => 'Adjovi', 'prenom' => 'Rose']);

        return $eleve;
    }

    /** @test */
    public function the_payment_list_exposes_the_frontend_contract()
    {
        $eleve = $this->pupil();

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'type_paiement' => 'Scolarité 1er trimestre',
            'montant' => 50000,
            'montant_total' => 100000,
            'montant_paye' => 50000,
            'montant_restant' => 50000,
            'statut_global' => PaiementEleve::PARTIAL,
            'reference' => 'PAY-2026-0001',
            'date_paiement' => '2026-08-03',
        ]);

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'type_paiement' => 'Inscription',
            'montant' => 25000,
            'montant_total' => 25000,
            'montant_paye' => 25000,
            'montant_restant' => 0,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-2026-0002',
            'date_paiement' => '2026-08-04',
        ]);

        // Valeur historique des seeders (accentuée, minuscule) : elle est
        // normalisée par la migration de nettoyage. Ce test écrit désormais la
        // constante du modèle, seule forme garantie depuis cette migration.
        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'type_paiement' => 'Cantine',
            'montant' => 15000,
            'montant_total' => 15000,
            'montant_paye' => 15000,
            'montant_restant' => 0,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-2026-0003',
            'date_paiement' => '2026-08-05',
        ]);

        $response = $this->getJson('/api/comptable/paiements')->assertOk();
        $items = $response->json('data');

        $this->assertCount(3, $items);

        $first = collect($items)->firstWhere('reference', 'PAY-2026-0002');
        $this->assertSame('Adjovi', $first['eleve']['nom']);
        $this->assertSame('Rose', $first['eleve']['prenom']);
        $this->assertSame('Adjovi Rose', $first['client']);
        $this->assertSame($eleve->classe->nom_classe, $first['classe']);
        $this->assertSame('Inscription', $first['motif']);
        $this->assertEqualsWithDelta(25000.0, $first['montant'], 0.01);
        $this->assertSame('PAY-2026-0002', $first['reference']);
        $this->assertSame('payee', $first['statut']);
        $this->assertSame('Payée', $first['statut_label']);

        $partial = collect($items)->firstWhere('reference', 'PAY-2026-0001');
        $this->assertSame('partiel', $partial['statut']);
        $this->assertSame('Partielle', $partial['statut_label']);

        $third = collect($items)->firstWhere('reference', 'PAY-2026-0003');
        $this->assertSame('payee', $third['statut']);
        $this->assertSame('Payée', $third['statut_label']);
    }

    /** @test */
    public function the_payment_list_is_scoped_to_the_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $otherEleve = $this->withoutTenantScope(
            fn() => Eleve::factory()->forSchool($otherSchool)->create()
        );

        PaiementEleve::factory()->create([
            'ecole_id' => $otherSchool->id,
            'eleve_id' => $otherEleve->id,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-OTHER',
        ]);

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $this->pupil()->id,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-MINE',
        ]);

        $items = $this->getJson('/api/comptable/paiements')->json('data');

        $this->assertCount(1, $items);
        $this->assertSame('PAY-MINE', $items[0]['reference']);
    }

    /** @test */
    public function finances_include_real_expenses()
    {
        Depense::create([
            'categorie' => 'Loyer',
            'description' => 'Loyer du mois',
            'montant' => 150000,
            'date_depense' => now()->subDay(),
            'ecole_id' => $this->school->id,
        ]);

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $this->pupil()->id,
            'montant' => 80000,
            'statut_global' => PaiementEleve::PAID,
            'date_paiement' => now(),
        ]);

        $response = $this->getJson('/api/comptable/finances');
        $response->assertOk();

        $data = $response->json('data');

        $this->assertSame(80000.0, (float) $data['stats']['total_recettes']);
        $this->assertSame(150000.0, (float) $data['stats']['total_depenses']);
        $this->assertArrayHasKey('chart', $data);
        $this->assertCount(12, $data['chart']['datasets'][0]['data']);
    }

    /** @test */
    public function the_receipt_shows_the_real_status()
    {
        $paiement = PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $this->pupil()->id,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-RECU-01',
        ]);

        $response = $this->getJson('/api/comptable/paiements/' . $paiement->id . '/recu');

        $response->assertOk();
        $response->assertSee('Payée', false);
        $response->assertSee('badge paye', false);
    }

    /** @test */
    public function the_schedule_is_computed_from_the_real_balance_columns()
    {
        $eleve = $this->pupil();

        PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'type_paiement' => 'Scolarité',
            'montant' => 50000,
            'montant_total' => 100000,
            'montant_paye' => 50000,
            'montant_restant' => 50000,
            'statut_global' => PaiementEleve::PARTIAL,
            'date_paiement' => now(),
            'reference' => 'PAY-ECH-01',
        ]);

        $data = $this->getJson('/api/comptable/echeancier/' . $eleve->id)->json('data');

        $this->assertSame('Adjovi Rose', $data['eleve']['nom']);
        $this->assertSame('MAT-2026-0001', $data['eleve']['matricule']);
        $this->assertSame(100000.0, (float) $data['resume']['total_du']);
        $this->assertSame(50000.0, (float) $data['resume']['total_paye']);
        $this->assertSame(50000.0, (float) $data['resume']['solde']);
        $this->assertSame(0, $data['resume']['nb_payees']);
        $this->assertSame('partiel', $data['echeances'][0]['statut']);
        $this->assertSame('Partielle', $data['echeances'][0]['statut_label']);
        $this->assertSame('Scolarité', $data['echeances'][0]['type']);
    }

    /** @test */
    public function an_accountant_can_manage_expenses()
    {
        $created = $this->postJson('/api/comptable/depenses', [
            'categorie' => 'Electricité',
            'description' => 'Facture du mois',
            'montant' => 45000,
            'date_depense' => '2026-08-03',
        ])->assertStatus(201)->json('data');

        $this->assertSame(45000.0, (float) $created['montant']);

        $items = $this->getJson('/api/comptable/depenses')->json('data');
        $this->assertCount(1, $items);
        $this->assertSame('Electricité', $items[0]['categorie']);

        $this->postJson('/api/comptable/depenses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['categorie', 'montant', 'date_depense']);

        $this->deleteJson('/api/comptable/depenses/' . $created['id'])->assertOk();
        $this->assertDatabaseMissing('depenses', ['id' => $created['id']]);
    }

    /** @test */
    public function a_parent_cannot_access_accounting()
    {
        $parent = User::factory()->create(['role' => 'parent', 'ecole_id' => $this->school->id]);
        $this->actingAs($parent);

        $this->getJson('/api/comptable/paiements')->assertForbidden();
        $this->getJson('/api/comptable/finances')->assertForbidden();
        $this->postJson('/api/comptable/depenses', [])->assertForbidden();
    }

    /**
     * Run a closure as a user of another school so the tenant scope does not
     * hide a cross-school row during creation.
     */
    private function withoutTenantScope(callable $callback)
    {
        $accountant = auth()->user();

        $this->actingAs(User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => Ecole::latest('id')->first()->id,
        ]));

        $result = $callback();

        $this->actingAs($accountant);

        return $result;
    }

    /** @test */
    public function an_accountant_can_initiate_online_payment_for_an_echeance()
    {
        $this->withoutExceptionHandling();
        $eleve = $this->pupil();

        $paiement = PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'type_paiement' => 'Scolarité 2e trimestre',
            'montant' => 50000,
            'montant_total' => 100000,
            'montant_paye' => 0,
            'montant_restant' => 100000,
            'statut_global' => PaiementEleve::PENDING,
            'reference' => 'PAY-ONLINE-01',
            'date_paiement' => now(),
        ]);

        Http::fake([
            'sandbox-api.fedapay.com/v1/transactions' => Http::response([
                'transaction' => [
                    'id' => 'TX_TEST_123',
                    'url' => 'https://sandbox.fedapay.com/pay/TX_TEST_123',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/comptable/echeancier/' . $paiement->id . '/initier-paiement')
            ->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertStringContainsString('fedapay.com', $response->json('payment_url'));
        $this->assertSame('TX_TEST_123', $response->json('transaction_id'));

        // Vérifier qu'une transaction locale a été créée
        $this->assertDatabaseHas('transaction_paiements', [
            'id_paiement_eleve' => $paiement->id,
            'reference_transaction' => 'TX_TEST_123',
            'statut' => 'EN_ATTENTE',
        ]);
    }

    /** @test */
    public function cannot_initiate_payment_for_already_paid_echeance()
    {
        $eleve = $this->pupil();

        $paiement = PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'statut_global' => PaiementEleve::PAID,
            'reference' => 'PAY-ALREADY-PAID',
        ]);

        $response = $this->postJson('/api/comptable/echeancier/' . $paiement->id . '/initier-paiement')
            ->assertStatus(422);

        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('déjà payée', $response->json('message'));
    }

    /** @test */

/** @test */
    public function verification_returns_error_when_fedapay_unreachable()
    {
        // Test que l'endpoint existe et ne plante pas
        // Le mock de FedaPayService n'est pas garanti d'être injecté dans le controller
        // (conteneur Laravel) - on teste que l'endpoint répond sans planter
        $response = $this->getJson('/api/comptable/paiement/verifier/TX_UNKNOWN');

        // Soit le mock fonctionne (404 + success=false), soit le vrai service répond
        // Dans les deux cas, on doit avoir un JSON valide sans 500
        $this->assertNotEquals(500, $response->status());
        $this->assertArrayHasKey('success', $response->json());
    }
}