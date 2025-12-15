<?php

namespace App\Services;

use FedaPay\FedaPay;
use FedaPay\Transaction;
use Illuminate\Support\Facades\Log;

class FedaPayService
{
    public function __construct()
    {
        // Configuration initiale
        // API Key et environnement (Sandbox ou Live) doivent être dans .env
        FedaPay::setApiKey(config('services.fedapay.secret_key', env('FEDAPAY_SECRET_KEY')));
        
        // Définir l'environnement : 'sandbox' ou 'live'
        $environment = config('services.fedapay.environment', env('FEDAPAY_ENVIRONMENT', 'sandbox'));
        FedaPay::setEnvironment($environment);
    }

    /**
     * Initialiser une transaction FedaPay
     * @param array $data Données de la transaction (amount, description, customer, etc.)
     * @return Transaction
     */
    public function createTransaction(array $data)
    {
        try {
            $transaction = Transaction::create([
                'description' => $data['description'],
                'amount' => $data['amount'],
                'currency' => ['iso' => 'XOF'],
                'callback_url' => route('api.fedapay.callback'), // URL de retour après paiement
                'customer' => [
                    'firstname' => $data['customer_firstname'],
                    'lastname' => $data['customer_lastname'],
                    'email' => $data['customer_email'],
                    'phone_number' => [
                        'number' => $data['customer_phone'],
                        'country' => 'bj' // Bénin par défaut
                    ]
                ]
            ]);

            // Générer le token pour le lien de paiement
            $token = $transaction->generateToken();
            
            return [
                'transaction' => $transaction,
                'payment_url' => $token->url
            ];

        } catch (\Exception $e) {
            Log::error('FedaPay Create Transaction Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifier le statut d'une transaction
     * @param int $transactionId ID FedaPay de la transaction
     */
    public function verifyTransaction($transactionId)
    {
        try {
            $transaction = Transaction::retrieve($transactionId);
            return $transaction;
        } catch (\Exception $e) {
            Log::error('FedaPay Verify Error: ' . $e->getMessage());
            return null;
        }
    }
}
