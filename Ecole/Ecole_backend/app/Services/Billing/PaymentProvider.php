<?php

namespace App\Services\Billing;

/**
 * PaymentProvider — Interface abstraite pour les fournisseurs de paiement.
 *
 * Supporte CinetPay (Afrique francophone), FedaPay (Afrique de l'Ouest),
 * et Stripe (international). Implémente le pattern Strategy.
 */
abstract class PaymentProvider
{
    /**
     * Initialize a payment.
     *
     * @param array $params
     *   - amount: float
     *   - currency: string (default: XOF)
     *   - description: string
     *   - reference: string (unique order reference)
     *   - callback_url: string (post-payment redirect)
     *   - cancel_url: string (cancellation redirect)
     *   - metadata: array
     * @return array
     *   - success: bool
     *   - payment_url: string|null (where to redirect the user)
     *   - transaction_id: string|null
     *   - error: string|null
     */
    abstract public function initializePayment(array $params): array;

    /**
     * Verify a payment status.
     *
     * @param string $transactionId
     * @return array
     *   - success: bool
     *   - status: string (completed, pending, failed)
     *   - amount: float|null
     *   - payment_method: string|null
     *   - error: string|null
     */
    abstract public function verifyPayment(string $transactionId): array;

    /**
     * Process a refund.
     *
     * @param string $transactionId
     * @param float|null $amount — Null for full refund
     * @return array
     *   - success: bool
     *   - refund_id: string|null
     *   - error: string|null
     */
    abstract public function refundPayment(string $transactionId, ?float $amount = null): array;

    /**
     * Get provider name.
     */
    abstract public function getName(): string;

    /**
     * Create a provider instance based on configuration.
     */
    public static function factory(?string $provider = null): PaymentProvider
    {
        $provider = $provider ?: config('billing.default_provider', 'stub');

        return match ($provider) {
            'cinetpay' => new CinetPayProvider(),
            'fedapay' => new FedaPayProvider(),
            'stripe' => new StripeProvider(),
            default => new StubProvider(),
        };
    }
}
