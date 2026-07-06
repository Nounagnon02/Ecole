<?php

namespace App\Services\Billing;

use Illuminate\Support\Facades\Http;

/**
 * FedaPayProvider — Intégration FedaPay (Afrique de l'Ouest).
 *
 * Docs: https://developers.fedapay.com
 */
class FedaPayProvider extends PaymentProvider
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $publicKey;

    public function __construct()
    {
        $this->apiKey = config('billing.fedapay.secret_key', '');
        $this->publicKey = config('billing.fedapay.public_key', '');
        $this->baseUrl = config('billing.fedapay.sandbox', true)
            ? 'https://sandbox-api.fedapay.com/v1'
            : 'https://api.fedapay.com/v1';
    }

    public function getName(): string
    {
        return 'fedapay';
    }

    public function initializePayment(array $params): array
    {
        try {
            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/transactions", [
                    'amount' => (int) ($params['amount'] * 100), // FedaPay uses cents
                    'currency' => ['iso' => $params['currency'] ?? 'XOF'],
                    'description' => $params['description'] ?? '',
                    'reference' => $params['reference'],
                    'callback_url' => $params['callback_url'] ?? route('billing.webhook.fedapay'),
                    'cancel_url' => $params['cancel_url'] ?? '',
                    'metadata' => $params['metadata'] ?? [],
                ]);

            $data = $response->json();

            if ($response->successful() && isset($data['transaction'])) {
                return [
                    'success' => true,
                    'payment_url' => $data['transaction']['url'] ?? null,
                    'transaction_id' => $data['transaction']['id'] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => $data['message'] ?? 'Erreur FedaPay',
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
            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/transactions/{$transactionId}");

            $data = $response->json();

            if ($response->successful() && isset($data['transaction'])) {
                $status = match ($data['transaction']['status'] ?? '') {
                    'approved' => 'completed',
                    'pending' => 'pending',
                    'canceled', 'declined' => 'failed',
                    default => 'pending',
                };

                return [
                    'success' => $status === 'completed',
                    'status' => $status,
                    'amount' => ($data['transaction']['amount'] ?? 0) / 100,
                    'payment_method' => $data['transaction']['payment_method_type'] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => $data['message'] ?? 'Erreur vérification FedaPay',
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
            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/transactions/{$transactionId}/refund", [
                    'amount' => $amount ? (int) ($amount * 100) : null,
                ]);

            $data = $response->json();

            if ($response->successful()) {
                return [
                    'success' => true,
                    'refund_id' => $data['refund']['id'] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'refund_id' => null,
                'error' => $data['message'] ?? 'Erreur remboursement FedaPay',
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
