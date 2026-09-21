<?php

namespace Tests\Unit\Services;

use App\Services\Billing\FedaPayProvider;
use App\Support\CircuitBreaker;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * FedaPay ne documente aucune reprise/coupe-circuit côté fournisseur -- sans
 * ça, un FedaPay lent ou en panne bloquait chaque requête jusqu'au timeout
 * par défaut, et une vraie panne prolongée faisait payer ce coût plein pot à
 * chaque nouvel appel.
 */
class FedaPayProviderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['billing.fedapay.secret_key' => 'sk_test', 'billing.fedapay.sandbox' => true]);
    }

    /** @test */
    public function a_transient_connection_failure_is_absorbed_by_a_retry()
    {
        Http::fake([
            'sandbox-api.fedapay.com/*' => Http::sequence()
                ->pushStatus(500)
                ->push(['transaction' => ['id' => 'TX_1', 'url' => 'https://x/pay/TX_1']], 200),
        ]);

        $result = (new FedaPayProvider())->initializePayment([
            'amount' => 1000,
            'reference' => 'REF_1',
            'callback_url' => 'https://app.test/callback',
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame('TX_1', $result['transaction_id']);
        Http::assertSentCount(2);
    }

    /** @test */
    public function repeated_server_errors_open_the_circuit_and_further_calls_stop_reaching_fedapay()
    {
        Notification::fake();
        Http::fake(['sandbox-api.fedapay.com/*' => Http::response(null, 500)]);

        $provider = new FedaPayProvider();

        // Seuil par défaut de CircuitBreaker::recordFailure() : 5. Chaque
        // appel ici épuise ses propres tentatives de retry (3 requêtes) avant
        // de compter comme un seul échec pour le coupe-circuit.
        for ($i = 0; $i < 5; $i++) {
            $provider->initializePayment(['amount' => 1000, 'reference' => "REF_{$i}", 'callback_url' => 'https://app.test/callback']);
        }

        $this->assertTrue(CircuitBreaker::isOpen('fedapay'));

        $callsBefore = count(Http::recorded());
        $result = $provider->initializePayment(['amount' => 1000, 'reference' => 'REF_APRES', 'callback_url' => 'https://app.test/callback']);

        $this->assertFalse($result['success']);
        $this->assertSame($callsBefore, count(Http::recorded()), 'Le circuit ouvert ne doit déclencher aucune requête HTTP supplémentaire.');
    }

    /** @test */
    public function a_declined_transaction_never_counts_against_the_circuit()
    {
        // Statut 402 : FedaPay répond, refuse la transaction -- ce n'est pas
        // une panne du fournisseur.
        Http::fake(['sandbox-api.fedapay.com/*' => Http::response(['message' => 'Carte refusée'], 402)]);

        $provider = new FedaPayProvider();

        for ($i = 0; $i < 10; $i++) {
            $provider->initializePayment(['amount' => 1000, 'reference' => "REF_{$i}", 'callback_url' => 'https://app.test/callback']);
        }

        $this->assertFalse(CircuitBreaker::isOpen('fedapay'));
    }
}
