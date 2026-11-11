<?php

namespace App\Services\Billing;

use App\Support\Alerting;
use App\Support\CircuitBreaker;
use Illuminate\Support\Facades\Http;

/**
 * FedaPayProvider — Intégration FedaPay (Afrique de l'Ouest).
 *
 * Docs: https://developers.fedapay.com
 *
 * Sans délai ni tentative de reprise, un FedaPay lent ou en panne bloquait
 * la requête entière jusqu'au timeout par défaut de Guzzle (souvent bien
 * plus long qu'utile ici), et chaque nouvelle requête pendant la panne
 * repayait ce même coût plein pot. `retry()` absorbe une coupure transitoire
 * (quelques centaines de ms) ; le coupe-circuit (`CircuitBreaker`) absorbe
 * une vraie panne prolongée en cessant d'essayer pendant sa fenêtre de
 * répit, une fois quelques échecs consécutifs constatés.
 */
class FedaPayProvider extends PaymentProvider
{
    private const CIRCUIT = 'fedapay';

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
        if (CircuitBreaker::isOpen(self::CIRCUIT)) {
            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => 'FedaPay temporairement indisponible, réessayez dans une minute.',
            ];
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/transactions", [
                // Le franc CFA n'a pas de centimes et FedaPay le compte à
                // l'unité : multiplier par 100 débitait cent fois le montant.
                'amount' => (int) round($params['amount']),
                'currency' => ['iso' => $params['currency'] ?? 'XOF'],
                'description' => $params['description'] ?? '',
                'merchant_reference' => $params['reference'] ?? null,
                'callback_url' => $params['callback_url'] ?? route('billing.webhook.fedapay'),
                'cancel_url' => $params['cancel_url'] ?? '',
                'custom_metadata' => $params['metadata'] ?? [],
            ]);

            $data = $response->json();
            $transaction = self::transaction($data);

            if ($response->successful() && $transaction) {
                CircuitBreaker::recordSuccess(self::CIRCUIT);

                return [
                    'success' => true,
                    'payment_url' => $transaction['payment_url'] ?? $transaction['url'] ?? null,
                    'transaction_id' => $transaction['id'] ?? null,
                    'error' => null,
                ];
            }

            $this->recordOutcome($response->serverError());

            return [
                'success' => false,
                'payment_url' => null,
                'transaction_id' => null,
                'error' => $data['message'] ?? 'Erreur FedaPay',
            ];
        } catch (\Exception $e) {
            $this->recordOutcome(true, $e->getMessage());

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
        if (CircuitBreaker::isOpen(self::CIRCUIT)) {
            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => 'FedaPay temporairement indisponible, réessayez dans une minute.',
            ];
        }

        try {
            $response = $this->client()->get("{$this->baseUrl}/transactions/{$transactionId}");

            $data = $response->json();

            $transaction = self::transaction($data);

            if ($response->successful() && $transaction) {
                CircuitBreaker::recordSuccess(self::CIRCUIT);

                // `transferred` : approuvée puis reversée au marchand.
                // `refunded` n'est plus un encaissement.
                $status = match ($transaction['status'] ?? '') {
                    'approved', 'transferred' => 'completed',
                    'canceled', 'declined', 'expired', 'refunded' => 'failed',
                    default => 'pending',
                };

                return [
                    'success' => $status === 'completed',
                    'status' => $status,
                    'amount' => (float) ($transaction['amount'] ?? 0),
                    'payment_method' => $transaction['mode'] ?? $transaction['payment_method_type'] ?? null,
                    'error' => null,
                ];
            }

            $this->recordOutcome($response->serverError());

            return [
                'success' => false,
                'status' => 'failed',
                'amount' => null,
                'payment_method' => null,
                'error' => $data['message'] ?? 'Erreur vérification FedaPay',
            ];
        } catch (\Exception $e) {
            $this->recordOutcome(true, $e->getMessage());

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
        if (CircuitBreaker::isOpen(self::CIRCUIT)) {
            return [
                'success' => false,
                'refund_id' => null,
                'error' => 'FedaPay temporairement indisponible, réessayez dans une minute.',
            ];
        }

        try {
            $response = $this->client()->post("{$this->baseUrl}/transactions/{$transactionId}/refund", [
                'amount' => $amount ? (int) round($amount) : null,
            ]);

            $data = $response->json();

            if ($response->successful()) {
                CircuitBreaker::recordSuccess(self::CIRCUIT);

                return [
                    'success' => true,
                    'refund_id' => $data['refund']['id'] ?? null,
                    'error' => null,
                ];
            }

            $this->recordOutcome($response->serverError());

            return [
                'success' => false,
                'refund_id' => null,
                'error' => $data['message'] ?? 'Erreur remboursement FedaPay',
            ];
        } catch (\Exception $e) {
            $this->recordOutcome(true, $e->getMessage());

            return [
                'success' => false,
                'refund_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * `retry(2, 200)` : deux tentatives supplémentaires, 200 ms puis 400 ms
     * (Laravel double l'attente par défaut), absorbent une coupure réseau
     * transitoire sans jamais dupliquer d'écriture -- ce client ne fait que
     * la requête HTTP, `throw: false` laisse chaque appelant lire
     * `$response->successful()` lui-même plutôt que de lever une exception.
     */
    /**
     * La transaction d'une réponse. FedaPay la range sous `v1/transaction` ;
     * `transaction` est la forme que simulaient nos tests historiques.
     */
    private static function transaction(mixed $data): ?array
    {
        $transaction = is_array($data) ? ($data['v1/transaction'] ?? $data['transaction'] ?? null) : null;

        return is_array($transaction) ? $transaction : null;
    }

    private function client()
    {
        // FedaPay refuse l'authentification Basic (401) : jeton Bearer.
        return Http::withToken($this->apiKey)
            ->timeout(10)
            ->retry(2, 200, throw: false);
    }

    private function recordOutcome(bool $isInfrastructureFailure, ?string $exceptionMessage = null): void
    {
        if (!$isInfrastructureFailure) {
            // Un 4xx (paramètres invalides, transaction refusée...) est un
            // résultat métier, pas une panne du fournisseur -- ne doit jamais
            // faire progresser le coupe-circuit vers l'ouverture.
            return;
        }

        CircuitBreaker::recordFailure(self::CIRCUIT);

        if (CircuitBreaker::isOpen(self::CIRCUIT)) {
            Alerting::anomaly('Coupe-circuit FedaPay ouvert', [
                'exception' => $exceptionMessage,
            ]);
        }
    }
}
