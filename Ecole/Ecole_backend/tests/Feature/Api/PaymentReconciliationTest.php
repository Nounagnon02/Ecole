<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Reconciliation of gateway passes (`payments`) against the accounting truth
 * (`paiements`).
 *
 * A payment confirmed through the provider used to credit `payments` only:
 * `montant_paye`/`montant_restant`/`statut_global` of the échéance stayed
 * untouched, so online collections never showed up in `finances()`. Since
 * Phase 2, `confirmPayment()` credits the linked échéance (PaiementEleve::credit)
 * exactly once, on the first pending → completed transition.
 *
 * The webhook is the only confirmation path that can be exercised without an
 * HTTP call to FedaPay, so the tests drive it with a signed payload.
 */
class PaymentReconciliationTest extends TestCase
{
    use RefreshDatabase;

    private function schoolWithAccountant(): array
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['role' => 'comptable', 'ecole_id' => $school->id]);

        return [$school, $user];
    }

    private function signedPayload(array $overrides = []): array
    {
        $payload = array_merge([
            'entity' => [
                'transaction' => [
                    'id'     => 'FEDA-1',
                    'status' => 'approved',
                ],
            ],
        ], $overrides);

        // config/services.php:fedapay.webhook_secret is null in tests; the
        // controller verifies hash_hmac('sha256', body, secret).
        $body = json_encode($payload);

        return [$body, hash_hmac('sha256', $body, null)];
    }

    /**
     * Deliver a raw webhook body (the signature covers the exact bytes).
     */
    private function postWebhook(string $body, string $signature)
    {
        return $this->call('POST', '/api/payments/webhook', [], [], [], [
            'HTTP_X-FedaPay-Signature' => $signature,
            'CONTENT_TYPE'             => 'application/json',
        ], $body);
    }

    /** @test */
    public function a_confirmed_gateway_pass_credits_the_linked_echeance()
    {
        [$school, $accountant] = $this->schoolWithAccountant();
        $this->actingAs($accountant);

        $pupil = Eleve::factory()->forSchool($school)->create();

        $echeance = PaiementEleve::create([
            'eleve_id'        => $pupil->id,
            'ecole_id'        => $school->id,
            'montant'         => 100000,
            'montant_total'   => 100000,
            'montant_paye'    => 0,
            'montant_restant' => 100000,
            'statut_global'   => PaiementEleve::PENDING,
            'type_paiement'   => 'Scolarité',
            'mode_paiement'   => 'MOBILE_MONEY',
            'date_paiement'   => now(),
        ]);

        $payment = Payment::create([
            'eleve_id'          => $pupil->id,
            'paiement_eleve_id' => $echeance->id,
            'ecole_id'          => $school->id,
            'transaction_id'    => 'FEDA-1',
            'amount'            => 40000,
            'type'              => 'scolarite',
            'description'       => 'Tranche 2',
            'status'            => 'pending',
            'currency'          => 'XOF',
        ]);

        [$body, $signature] = $this->signedPayload();

        $this->postWebhook($body, $signature)
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertSame('completed', $payment->fresh()->status);
        $this->assertSame(PaiementEleve::PARTIAL, $echeance->fresh()->statut_global);
        $this->assertSame(40000.0, (float) $echeance->fresh()->montant_paye);
        $this->assertSame(60000.0, (float) $echeance->fresh()->montant_restant);
    }

    /** @test */
    public function a_redelivered_webhook_does_not_credit_twice()
    {
        [$school, $accountant] = $this->schoolWithAccountant();
        $this->actingAs($accountant);

        $pupil = Eleve::factory()->forSchool($school)->create();

        $echeance = PaiementEleve::create([
            'eleve_id'        => $pupil->id,
            'ecole_id'        => $school->id,
            'montant'         => 100000,
            'montant_total'   => 100000,
            'montant_paye'    => 0,
            'montant_restant' => 100000,
            'statut_global'   => PaiementEleve::PENDING,
            'type_paiement'   => 'Scolarité',
            'mode_paiement'   => 'MOBILE_MONEY',
            'date_paiement'   => now(),
        ]);

        Payment::create([
            'eleve_id'          => $pupil->id,
            'paiement_eleve_id' => $echeance->id,
            'ecole_id'          => $school->id,
            'transaction_id'    => 'FEDA-2',
            'amount'            => 40000,
            'type'              => 'scolarite',
            'description'       => 'Tranche 2',
            'status'            => 'pending',
            'currency'          => 'XOF',
        ]);

        [$body, $signature] = $this->signedPayload(['entity' => ['transaction' => ['id' => 'FEDA-2', 'status' => 'approved']]]);

        $this->postWebhook($body, $signature)->assertOk();
        $this->postWebhook($body, $signature)->assertOk();

        $this->assertSame(40000.0, (float) $echeance->fresh()->montant_paye);
        $this->assertSame(60000.0, (float) $echeance->fresh()->montant_restant);
    }

    /** @test */
    public function a_full_settlement_flips_the_echeance_to_paid()
    {
        [$school, $accountant] = $this->schoolWithAccountant();
        $this->actingAs($accountant);

        $pupil = Eleve::factory()->forSchool($school)->create();

        $echeance = PaiementEleve::create([
            'eleve_id'        => $pupil->id,
            'ecole_id'        => $school->id,
            'montant'         => 50000,
            'montant_total'   => 50000,
            'montant_paye'    => 30000,
            'montant_restant' => 20000,
            'statut_global'   => PaiementEleve::PARTIAL,
            'type_paiement'   => 'Scolarité',
            'mode_paiement'   => 'MOBILE_MONEY',
            'date_paiement'   => now(),
        ]);

        Payment::create([
            'eleve_id'          => $pupil->id,
            'paiement_eleve_id' => $echeance->id,
            'ecole_id'          => $school->id,
            'transaction_id'    => 'FEDA-3',
            'amount'            => 20000,
            'type'              => 'scolarite',
            'description'       => 'Dernière tranche',
            'status'            => 'pending',
            'currency'          => 'XOF',
        ]);

        [$body, $signature] = $this->signedPayload(['entity' => ['transaction' => ['id' => 'FEDA-3', 'status' => 'approved']]]);

        $this->postWebhook($body, $signature)->assertOk();

        $this->assertSame(PaiementEleve::PAID, $echeance->fresh()->statut_global);
        $this->assertSame(0.0, (float) $echeance->fresh()->montant_restant);
    }

    /** @test */
    public function a_payment_without_a_linked_echeance_stays_in_the_journal()
    {
        [$school, $accountant] = $this->schoolWithAccountant();
        $this->actingAs($accountant);

        $pupil = Eleve::factory()->forSchool($school)->create();

        Payment::create([
            'eleve_id'       => $pupil->id,
            'ecole_id'       => $school->id,
            'transaction_id' => 'FEDA-4',
            'amount'         => 5000,
            'type'           => 'cantine',
            'description'    => 'Cantine',
            'status'         => 'pending',
            'currency'       => 'XOF',
        ]);

        [$body, $signature] = $this->signedPayload(['entity' => ['transaction' => ['id' => 'FEDA-4', 'status' => 'approved']]]);

        $this->postWebhook($body, $signature)->assertOk();

        $this->assertSame('completed', Payment::firstWhere('transaction_id', 'FEDA-4')->status);
        $this->assertSame(0, PaiementEleve::count());
    }
}
