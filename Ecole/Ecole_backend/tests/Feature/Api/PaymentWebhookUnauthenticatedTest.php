<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Support\SchoolContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Le webhook de paiement, dans les conditions réelles (audit A1).
 *
 * `PaymentReconciliationTest` couvre la réconciliation, mais chacun de ses cas
 * appelle `actingAs()` avant de livrer la charge utile. Le webhook s'y exécute
 * donc sous une identité authentifiée — que la production n'a pas : FedaPay
 * rappelle le serveur, il ne se connecte pas. Le scope `ecole`, résolu depuis
 * `auth()->user()` ou la session, retombait alors sur `whereRaw('1 = 0')` et le
 * paiement n'était jamais retrouvé : réponse 200, aucun encaissement.
 *
 * Aucun test de ce fichier n'appelle `actingAs`. C'est la seule chose qui les
 * distingue de leurs équivalents, et c'est tout l'intérêt.
 */
class PaymentWebhookUnauthenticatedTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Monter l'école, l'élève, l'échéance et le paiement en attente.
     *
     * Le décor s'écrit sous `SchoolContext` — un seeder n'a pas plus
     * d'utilisateur authentifié que le webhook.
     *
     * @return array{0: Ecole, 1: PaiementEleve, 2: Payment}
     */
    private function pendingPayment(int $montant = 40000): array
    {
        $school = Ecole::factory()->create(['status' => 'active']);

        return SchoolContext::for($school->id, function () use ($school, $montant) {
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
                'transaction_id'    => 'FEDA-SANS-SESSION',
                'amount'            => $montant,
                'type'              => 'scolarite',
                'description'       => 'Tranche 2',
                'status'            => 'pending',
                'currency'          => 'XOF',
            ]);

            return [$school, $echeance, $payment];
        });
    }

    private function deliver(string $status = 'approved'): \Illuminate\Testing\TestResponse
    {
        $body = json_encode([
            'entity' => [
                'transaction' => [
                    'id'     => 'FEDA-SANS-SESSION',
                    'status' => $status,
                ],
            ],
        ]);

        return $this->call('POST', '/api/payments/webhook', [], [], [], [
            'HTTP_X-FedaPay-Signature' => hash_hmac('sha256', $body, (string) config('services.fedapay.webhook_secret')),
            'CONTENT_TYPE'             => 'application/json',
        ], $body);
    }

    /** @test */
    public function an_unauthenticated_webhook_still_finds_and_credits_the_payment()
    {
        [, $echeance, $payment] = $this->pendingPayment();

        $this->assertGuest();

        $this->deliver()->assertOk()->assertJson(['success' => true]);

        $this->assertSame('completed', $payment->fresh()->status);

        $fresh = SchoolContext::for($echeance->ecole_id, fn () => $echeance->fresh());
        $this->assertSame(PaiementEleve::PARTIAL, $fresh->statut_global);
        $this->assertSame(40000.0, (float) $fresh->montant_paye);
        $this->assertSame(60000.0, (float) $fresh->montant_restant);
    }

    /**
     * L'historique doit porter l'école du paiement.
     *
     * Sans contexte lié, le crochet `creating` de `BelongsToEcole` écrivait
     * `ecole_id = null` : la ligne n'appartenait à aucun établissement et
     * devenait invisible pour tous, y compris pour le comptable concerné.
     *
     * @test
     */
    public function the_history_row_is_attached_to_the_payments_school()
    {
        [$school, , $payment] = $this->pendingPayment();

        $this->deliver()->assertOk();

        $history = PaymentHistory::withoutGlobalScope('ecole')
            ->where('payment_id', $payment->id)
            ->get();

        $this->assertNotEmpty($history, "Le webhook doit journaliser l'encaissement.");
        foreach ($history as $ligne) {
            $this->assertSame($school->id, $ligne->ecole_id);
        }
    }

    /** @test */
    public function an_unauthenticated_webhook_marks_a_declined_transaction_as_failed()
    {
        [, , $payment] = $this->pendingPayment();

        $this->deliver('declined')->assertOk();

        $this->assertSame('failed', $payment->fresh()->status);
    }

    /** @test */
    public function a_webhook_without_a_signature_header_is_rejected()
    {
        $this->pendingPayment();

        $this->call('POST', '/api/payments/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], '{}')->assertStatus(401);
    }

    /**
     * Une signature invalide n'est pas seulement rejetée : elle doit se voir
     * quelque part (jamais consultée sans alerte avant cet ajout).
     *
     * @test
     */
    public function a_rejected_signature_raises_an_anomaly_alert()
    {
        $this->pendingPayment();
        \Illuminate\Support\Facades\Log::spy();

        $this->call('POST', '/api/payments/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], '{}')->assertStatus(401);

        \Illuminate\Support\Facades\Log::shouldHaveReceived('critical')->withArgs(
            fn ($message) => str_contains($message, 'Webhook de paiement rejeté')
        )->once();
    }
}
