<?php

namespace App\Services;

use App\Services\Billing\PaymentProvider;
use Illuminate\Support\Facades\Log;

class FedaPayService
{
    protected PaymentProvider $provider;

    public function __construct()
    {
        $this->provider = PaymentProvider::factory('fedapay');
    }

    /**
     * Initialiser une transaction FedaPay
     * @param array $data Données de la transaction (amount, description, customer, etc.)
     * @return array{transaction: object, payment_url: string}
     */
    public function createTransaction(array $data)
    {
        try {
            $reference = 'TX_' . uniqid();

            $result = $this->provider->initializePayment([
                'amount' => $data['amount'],
                'currency' => 'XOF',
                'description' => $data['description'] ?? 'Paiement école',
                'reference' => $reference,
                'callback_url' => route('api.fedapay.callback'),
                'metadata' => [
                    'customer_firstname' => $data['customer_firstname'] ?? '',
                    'customer_lastname' => $data['customer_lastname'] ?? '',
                    'customer_email' => $data['customer_email'] ?? '',
                    'customer_phone' => $data['customer_phone'] ?? '',
                ],
            ]);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Erreur FedaPay');
            }

            return [
                'transaction' => (object) [
                    'id' => $result['transaction_id'],
                ],
                'payment_url' => $result['payment_url'],
            ];

        } catch (\Exception $e) {
            Log::error('FedaPay Create Transaction Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifier le statut d'une transaction
     * @param int|string $transactionId ID FedaPay de la transaction
     * @return object|null {id, status, ...} ou null si erreur
     */
    public function verifyTransaction($transactionId)
    {
        try {
            $result = $this->provider->verifyPayment((string) $transactionId);

            return (object) [
                'id' => $transactionId,
                'status' => $result['status'] === 'completed' ? 'approved' : $result['status'],
            ];
        } catch (\Exception $e) {
            Log::error('FedaPay Verify Error: ' . $e->getMessage());
            return null;
        }
    }
}
