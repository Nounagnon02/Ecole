<?php

namespace App\Services\Billing;

use Illuminate\Support\Facades\Http;

/**
 * CinetPayProvider — Intégration CinetPay (Afrique francophone).
 *
 * Docs: https://docs.cinetpay.com
 */
class CinetPayProvider extends PaymentProvider
{
    protected string $apiKey;
    protected string $siteId;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('billing.cinetpay.api_key', '');
        $this->siteId = config('billing.cinetpay.site_id', '');
        $this->baseUrl = config('billing.cinetpay.sandbox', true)
            ? 'https://sandbox.cinetpay.com/api/v1'
            : 'https://api.cinetpay.com/api/v1';
    }

    public function getName(): string
    {
        return 'cinetpay';
    }

    public function initializePayment(array $params): array
    {
        try {
            $response = Http::post("{$this->baseUrl}/payment/init", [
                'apikey' => $this->apiKey,
                'site_id' => $this->siteId,
                'transaction_id' => $params['reference'],
                'amount' => $params['amount'],
                'currency' => $params['currency'] ?? 'XOF',
                'description' => $params['description'] ?? '',
                'notify_url' => $params['callback_url'] ?? route('billing.webhook.cinetpay'),
                'return_url' => $params['callback_url'] ?? '',
                'cancel_url' => $params['cancel_url'] ?? '',
                'metadata' => $params['metadata'] ?? [],
            ]);

            $data = $response->json();

            if ($response->successful() && ($data['code'] ?? '') === '201') {
                return [
                    'success' => true,
                    'payment_url' => $data['data']['payment_url'] ?? null,
                    'transaction_id' => $data['data']['transaction_id'] ?? $params['reference'],
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => $data['message'] ?? 'Erreur CinetPay',
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
            $response = Http::post("{$this->baseUrl}/payment/check", [
                'apikey' => $this->apiKey,
                'site_id' => $this->siteId,
                'transaction_id' => $transactionId,
            ]);

            $data = $response->json();

            if ($response->successful()) {
                $status = match ($data['data']['status'] ?? '') {
                    '00' => 'completed',
                    '01' => 'pending',
                    '02' => 'failed',
                    default => 'pending',
                };

                return [
                    'success' => $status === 'completed',
                    'status' => $status,
                    'amount' => $data['data']['amount'] ?? null,
                    'payment_method' => $data['data']['payment_method'] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => $data['message'] ?? 'Erreur vérification CinetPay',
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
            $response = Http::post("{$this->baseUrl}/payment/refund", [
                'apikey' => $this->apiKey,
                'site_id' => $this->siteId,
                'transaction_id' => $transactionId,
                'amount' => $amount,
            ]);

            $data = $response->json();

            if ($response->successful() && ($data['code'] ?? '') === '201') {
                return [
                    'success' => true,
                    'refund_id' => $data['data']['refund_id'] ?? null,
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'refund_id' => null,
                'error' => $data['message'] ?? 'Erreur remboursement CinetPay',
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
