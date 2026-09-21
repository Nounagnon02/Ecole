<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * PaymentController — le chemin heureux d'`initializePayment`, jamais testé
 * (`PaymentEndpointTest` ne vérifiait que le 401 anonyme), et la sûreté
 * transactionnelle des deux méthodes qui ouvrent `DB::beginTransaction()`.
 *
 * `initializePayment` et `processRefund` appelaient
 * `rethrowIfMeaningful($e)` AVANT `DB::rollBack()` dans leur `catch` — le
 * même bug que celui trouvé dans `AuthController::inscription()` (cf.
 * commit précédent) : une exception « signifiante » (403/404/422) relancée
 * avant le rollback laisse la comptabilité de transactions de Laravel
 * désynchronisée de la connexion PDO réelle. `processRefund` avait en plus
 * un retour anticipé (statut de remboursement invalide) sans rollback du
 * tout.
 */
class PaymentTransactionSafetyTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $accountant;
    private Eleve $eleve;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->accountant = User::factory()->create([
            'role' => 'comptable',
            'ecole_id' => $this->school->id,
        ]);
        $this->eleve = Eleve::factory()->forSchool($this->school)->create();
    }

    /** @test */
    public function a_manager_can_initialize_a_payment()
    {
        Http::fake([
            'sandbox-api.fedapay.com/v1/transactions' => Http::response([
                'transaction' => ['id' => 'TX_INIT_1', 'url' => 'https://sandbox.fedapay.com/pay/TX_INIT_1'],
            ], 200),
        ]);

        $response = $this->actingAs($this->accountant)->postJson('/api/payments/initialize', [
            'eleve_id' => $this->eleve->id,
            'amount' => 25000,
            'description' => 'Scolarité 1er trimestre',
            'type' => 'scolarite',
        ])->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertSame('TX_INIT_1', $response->json('data.transaction_id'));
        $this->assertSame('https://sandbox.fedapay.com/pay/TX_INIT_1', $response->json('data.checkout_url'));
        $this->assertDatabaseHas('payments', [
            'eleve_id' => $this->eleve->id,
            'transaction_id' => 'TX_INIT_1',
            'checkout_url' => 'https://sandbox.fedapay.com/pay/TX_INIT_1',
        ]);
    }

    /**
     * FedaPay ne documente aucune clé d'idempotence côté fournisseur (vérifié
     * dans leur documentation) : un double clic ou un retry réseau doit donc
     * être absorbé avant même d'atteindre FedaPay, pas seulement une fois la
     * transaction revenue.
     *
     * @test
     */
    public function a_rapid_duplicate_request_reuses_the_same_transaction_instead_of_opening_a_second_one()
    {
        Http::fake([
            'sandbox-api.fedapay.com/v1/transactions' => Http::response([
                'transaction' => ['id' => 'TX_DOUBLE_CLICK', 'url' => 'https://sandbox.fedapay.com/pay/TX_DOUBLE_CLICK'],
            ], 200),
        ]);

        $payload = [
            'eleve_id' => $this->eleve->id,
            'amount' => 25000,
            'description' => 'Scolarité 1er trimestre',
            'type' => 'scolarite',
        ];

        $first = $this->actingAs($this->accountant)->postJson('/api/payments/initialize', $payload)->assertOk();
        $second = $this->actingAs($this->accountant)->postJson('/api/payments/initialize', $payload)->assertOk();

        $this->assertSame($first->json('data.payment_id'), $second->json('data.payment_id'));
        $this->assertSame('TX_DOUBLE_CLICK', $second->json('data.transaction_id'));
        Http::assertSentCount(1);
        $this->assertSame(1, Payment::where('eleve_id', $this->eleve->id)->count());
    }

    /**
     * Une intention de paiement différente (montant distinct) ne doit jamais
     * être fusionnée avec une autre, même toute récente.
     *
     * @test
     */
    public function a_different_amount_is_never_treated_as_a_duplicate()
    {
        Http::fake([
            'sandbox-api.fedapay.com/v1/transactions' => Http::sequence()
                ->push(['transaction' => ['id' => 'TX_A', 'url' => 'https://sandbox.fedapay.com/pay/TX_A']])
                ->push(['transaction' => ['id' => 'TX_B', 'url' => 'https://sandbox.fedapay.com/pay/TX_B']]),
        ]);

        $base = [
            'eleve_id' => $this->eleve->id,
            'description' => 'Scolarité 1er trimestre',
            'type' => 'scolarite',
        ];

        $this->actingAs($this->accountant)->postJson('/api/payments/initialize', $base + ['amount' => 25000])->assertOk();
        $this->actingAs($this->accountant)->postJson('/api/payments/initialize', $base + ['amount' => 30000])->assertOk();

        Http::assertSentCount(2);
        $this->assertSame(2, Payment::where('eleve_id', $this->eleve->id)->count());
    }

    /** @test */
    public function refusing_access_to_the_student_does_not_leave_a_transaction_open()
    {
        $stranger = User::factory()->create(['role' => 'eleve', 'ecole_id' => $this->school->id]);
        $niveauAvant = DB::transactionLevel();

        $this->actingAs($stranger)->postJson('/api/payments/initialize', [
            'eleve_id' => $this->eleve->id,
            'amount' => 25000,
            'description' => 'Scolarité',
            'type' => 'scolarite',
        ])->assertStatus(403);

        $this->assertSame($niveauAvant, DB::transactionLevel());
    }

    /** @test */
    public function a_refund_request_not_in_the_requested_state_does_not_leave_a_transaction_open()
    {
        $payment = Payment::create([
            'eleve_id' => $this->eleve->id,
            'ecole_id' => $this->school->id,
            'amount' => 10000,
            'type' => 'scolarite',
            'description' => 'Scolarité',
            'status' => 'completed',
            'refund_status' => 'none',
            'currency' => 'XOF',
        ]);

        $this->actingAs($this->accountant);
        $niveauAvant = DB::transactionLevel();

        // `processRefund` n'est routée nulle part actuellement (code mort,
        // cf. audit) : appel direct du contrôleur plutôt qu'une requête HTTP.
        app()->call([app(\App\Http\Controllers\Payment\PaymentController::class), 'processRefund'],
            ['request' => \Illuminate\Http\Request::create('/', 'POST', ['payment_id' => $payment->id])]
        );

        $this->assertSame($niveauAvant, DB::transactionLevel());
    }
}
