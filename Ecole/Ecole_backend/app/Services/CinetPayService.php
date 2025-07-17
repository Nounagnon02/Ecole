<?php

namespace App\Services;

use CinetPay\CinetPay;
use Illuminate\Support\Facades\Log;
use App\Models\PaiementEleve;
use App\Models\TransactionPaiement;
use App\Models\StatutTranche;

class CinetPayService
{
    private $cinetpay;
    
    public function __construct()
    {
        $this->cinetpay = new CinetPay(
            config('services.cinetpay.site_id'),
            config('services.cinetpay.api_key'),
            config('services.cinetpay.environment', 'sandbox')
        );
    }

    /**
     * Initier un paiement pour une tranche spécifique
     */
    public function initiatePayment($paiementEleve, $tranche, $montant, $eleveInfo)
    {
        $transactionId = 'PAY_' . $paiementEleve->id . '_' . $tranche . '_' . time();
        
        $paymentData = [
            'amount' => $montant,
            'currency' => config('services.cinetpay.currency', 'XOF'),
            'description' => "Paiement frais scolaires - {$eleveInfo['nom']} {$eleveInfo['prenom']} - Tranche: {$tranche}",
            'return_url' => route('payment.return'),
            'notify_url' => route('payment.notify'),
            'customer_name' => $eleveInfo['nom'] . ' ' . $eleveInfo['prenom'],
            'customer_email' => $eleveInfo['email'] ?? 'parent@example.com',
            'customer_phone_number' => $eleveInfo['telephone'] ?? '',
            'metadata' => [
                'paiement_eleve_id' => $paiementEleve->id,
                'tranche' => $tranche,
                'eleve_id' => $paiementEleve->id_eleve,
                'contribution_id' => $paiementEleve->id_contribution
            ]
        ];
        
        return $this->createPayment($transactionId, $paymentData);
    }

    /**
     * Créer un paiement avec CinetPay
     */
    public function createPayment($transactionId, $paymentData)
    {
        try {
            $this->cinetpay->setAmount($paymentData['amount'])
                          ->setCurrency($paymentData['currency'])
                          ->setDescription($paymentData['description'])
                          ->setCustomData('metadata', json_encode($paymentData['metadata']))
                          ->setClientPhoneNumber($paymentData['customer_phone_number'])
                          ->setClientEmail($paymentData['customer_email'])
                          ->setClientName($paymentData['customer_name'])
                          ->setNotifyUrl($paymentData['notify_url'])
                          ->setReturnUrl($paymentData['return_url'])
                          ->setCancelUrl($paymentData['return_url']);

            $paymentResponse = $this->cinetpay->createPayment($transactionId);
            
            return [
                'success' => true,
                'payment_url' => $paymentResponse['payment_url'],
                'transaction_id' => $transactionId,
                'payment_token' => $paymentResponse['payment_token'] ?? null
            ];
            
        } catch (\Exception $e) {
            Log::error('CinetPay Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de la création du paiement',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Vérifier le statut d'un paiement
     */
    public function checkPaymentStatus($transactionId)
    {
        try {
            $status = $this->cinetpay->checkPaymentStatus($transactionId);
            
            return [
                'success' => true,
                'status' => $status['status'],
                'operator' => $status['operator'] ?? null,
                'payment_method' => $status['payment_method'] ?? null,
                'amount' => $status['amount'] ?? null,
                'currency' => $status['currency'] ?? null
            ];
            
        } catch (\Exception $e) {
            Log::error('CinetPay Status Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur de vérification du statut',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Vérifier la signature pour les notifications
     */
    public function verifySignature($receivedData)
    {
        $apiKey = config('services.cinetpay.api_key');
        $siteId = config('services.cinetpay.site_id');
        
        $signatureData = $receivedData['cpm_trans_id'] . 
                        $receivedData['cpm_amount'] . 
                        $receivedData['cpm_currency'] . 
                        $apiKey . 
                        $siteId;
        
        return hash_equals(hash('sha256', $signatureData), $receivedData['signature'] ?? '');
    }

    /**
     * Traiter le paiement réussi
     */
    public function processSuccessfulPayment($transactionId, $paymentData)
    {
        try {
            $metadata = json_decode($paymentData['metadata'] ?? '{}', true);
            
            $paiementEleve = PaiementEleve::find($metadata['paiement_eleve_id']);
            if (!$paiementEleve) {
                throw new \Exception('Paiement élève non trouvé');
            }

            // Créer la transaction
            $transaction = TransactionPaiement::create([
                'id_paiement_eleve' => $paiementEleve->id,
                'tranche' => $metadata['tranche'],
                'montant_paye' => $paymentData['cpm_amount'],
                'date_paiement' => now(),
                'statut' => 'PAYE',
                'methode_paiement' => 'MOBILE_MONEY',
                'reference_transaction' => $transactionId,
                'recu_par' => 'Système CinetPay',
                'observation' => 'Paiement en ligne via CinetPay'
            ]);

            // Mettre à jour le statut de la tranche
            $this->updateTrancheStatus($paiementEleve->id, $metadata['tranche'], $paymentData['cpm_amount']);

            // Mettre à jour le paiement global
            $this->updatePaiementGlobal($paiementEleve);

            return ['success' => true, 'transaction' => $transaction];
            
        } catch (\Exception $e) {
            Log::error('Erreur traitement paiement: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Mettre à jour le statut d'une tranche
     */
    private function updateTrancheStatus($paiementEleveId, $tranche, $montant)
    {
        StatutTranche::where('id_paiement_eleve', $paiementEleveId)
                    ->where('tranche', $tranche)
                    ->update([
                        'statut' => 'PAYE',
                        'date_paiement' => now()
                    ]);
    }

    /**
     * Mettre à jour le paiement global
     */
    private function updatePaiementGlobal($paiementEleve)
    {
        $totalPaye = TransactionPaiement::where('id_paiement_eleve', $paiementEleve->id)
                                      ->where('statut', 'PAYE')
                                      ->sum('montant_paye');

        $paiementEleve->update([
            'montant_total_paye' => $totalPaye,
            'montant_restant' => $paiementEleve->contribution->montant - $totalPaye,
            'statut_global' => $totalPaye >= $paiementEleve->contribution->montant ? 'TERMINE' : 'EN_COURS'
        ]);
    }
}