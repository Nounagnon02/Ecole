<?php

namespace App\Services\Billing;

use Illuminate\Support\Facades\Http;

/**
 * StripeProvider — Intégration Stripe (international).
 *
 * Docs: https://stripe.com/docs/api
 */
class StripeProvider extends PaymentProvider
{
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('billing.stripe.secret_key', '');
        $this->baseUrl = 'https://api.stripe.com/v1';
    }

    public function getName(): string
    {
        return 'stripe';
    }

    public function initializePayment(array $params): array
    {
        try {
            $response = Http::withToken($this->secretKey)
                ->asForm()
                ->post("{$this->baseUrl}/checkout/sessions", [
                    'mode' => 'payment',
                    'success_url' => $params['callback_url'] ?? '',
                    'cancel_url' => $params['cancel_url'] ?? '',
                    'line_items' => [[
                        'price_data' => [
                            'currency' => strtolower($params['currency'] ?? 'xof'),
                            'unit_amount' => (int) ($params['amount'] * 100),
                            'product_data' => [
                                'name' => $params['description'] ?? 'Paiement École',
                            ],
                        ],
                        'quantity' => 1,
                    ]],
                    'metadata' => array_merge(
                        $params['metadata'] ?? [],
                        ['reference' => $params['reference']]
                    ),
                ]);

            $data = $response->json();

            if ($response->successful() && isset($data['id'])) {
                return [
                    'success' => true,
                    'payment_url' => $data['url'] ?? null,
                    'transaction_id' => $data['id'],
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => $data['error']['message'] ?? 'Erreur Stripe',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function verifyPayment(string $transactionId): array
    {
        try {
            $response = Http::withToken($this->secretKey)
                ->get("{$this->baseUrl}/checkout/sessions/{$transactionId}");

            $data = $response->json();

            if ($response->successful()) {
                $status = match ($data['payment_status'] ?? '') {
                    'paid' => 'completed',
                    'unpaid' => 'pending',
                    'no_payment_required' => 'completed',
                    default => 'pending',
                };

                return [
                    'success' => $status === 'completed',
                    'status' => $status,
                    'amount' => ($data['amount_total'] ?? 0) / 100,
                    'payment_method' => $data['payment_method_types'][0] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => $data['error']['message'] ?? 'Erreur vérification Stripe',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function refundPayment(string $transactionId, ?float $amount = null): array
    {
        try {
            $payload = ['payment_intent' => $transactionId];
            if ($amount !== null) {
                $payload['amount'] = (int) ($amount * 100);
            }

            $response = Http::withToken($this->secretKey)
                ->asForm()
                ->post("{$this->baseUrl}/refunds", $payload);

            $data = $response->json();

            if ($response->successful() && isset($data['id'])) {
                return [
                    'success' => true,
                    'refund_id' => $data['id'],
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'refund_id' => null,
                'error' => $data['error']['message'] ?? 'Erreur remboursement Stripe',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'refund_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
