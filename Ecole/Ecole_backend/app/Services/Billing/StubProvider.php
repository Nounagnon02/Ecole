<?php

namespace App\Services\Billing;

/**
 * StubProvider — Provider de test/développement.
 * Simule les réponses sans faire d'appels réels.
 */
class StubProvider extends PaymentProvider
{
    public function getName(): string
    {
        return 'stub';
    }

    public function initializePayment(array $params): array
    {
        return [
            'success' => true,
            'payment_url' => '/billing/stub-pay/' . $params['reference'],
            'transaction_id' => 'stub_' . uniqid(),
            'error' => null,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        return [
            'success' => true,
            'status' => 'completed',
            'amount' => 0,
            'payment_method' => 'stub',
            'error' => null,
        ];
    }

    public function refundPayment(string $transactionId, ?float $amount = null): array
    {
        return [
            'success' => true,
            'refund_id' => 'stub_refund_' . uniqid(),
            'error' => null,
        ];
    }
}
