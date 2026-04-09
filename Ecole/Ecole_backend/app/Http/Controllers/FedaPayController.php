<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\FedaPayService;
use App\Services\CommunicationService;
use App\Models\TransactionPaiement;
use App\Models\Eleve;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FedaPayController extends Controller
{
    protected $fedapayService;
    protected $commService;

    public function __construct(FedaPayService $fedapayService, CommunicationService $commService)
    {
        $this->fedapayService = $fedapayService;
        $this->commService = $commService;
    }

    /**
     * Initialiser un paiement via FedaPay
     * POST /api/fedapay/init/{eleve_id}
     */
    public function initier(Request $request, $eleve_id)
    {
        try {
            $eleve = Eleve::with('user')->findOrFail($eleve_id);
            $amount = $request->input('amount');

            if (!$amount || $amount <= 0) {
                return response()->json(['success' => false, 'message' => 'Montant invalide'], 422);
            }

            // Création de la transaction en base locale
            $tx = TransactionPaiement::create([
                'eleve_id' => $eleve->id,
                'montant_paye' => $amount,
                'statut' => 'EN_ATTENTE',
                'methode_paiement' => 'FEDAPAY',
            ]);

            // Appel au service FedaPay
            $result = $this->fedapayService->createTransaction([
                'description' => "Paiement Scolarité - " . $eleve->user->name . " " . $eleve->user->prenom,
                'amount' => $amount,
                'customer_firstname' => $eleve->user->prenom,
                'customer_lastname' => $eleve->user->name,
                'customer_email' => $eleve->user->email ?? 'contact@ecole.pj',
                'customer_phone' => $eleve->user->telephone ?? '00000000'
            ]);

            // Mise à jour avec l'ID FedaPay
            $tx->update([
                'cinetpay_transaction_id' => $result['transaction']->id,
            ]);

            return response()->json([
                'success' => true,
                'payment_url' => $result['payment_url']
            ]);

        } catch (\Exception $e) {
            Log::error('FedaPay Init Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Webhook pour FedaPay
     */
    public function webhook(Request $request)
    {
        $transactionId = $request->input('id');
        
        try {
            $transaction = $this->fedapayService->verifyTransaction($transactionId);

            if ($transaction && $transaction->status === 'approved') {
                $tx = TransactionPaiement::where('cinetpay_transaction_id', $transactionId)
                    ->with('eleve.user')
                    ->first();

                if ($tx && $tx->statut !== 'PAYE') {
                    DB::transaction(function () use ($tx) {
                        $tx->update(['statut' => 'PAYE', 'date_paiement' => now()]);
                        
                        // Envoi de la notification SMS au parent
                        $this->commService->notifyPayment(
                            $tx->eleve->user->telephone ?? '00000000',
                            $tx->montant_paye,
                            $tx->eleve->user->name
                        );
                    });
                }
            }
            return response()->json(['received' => true]);
        } catch (\Exception $e) {
            Log::error("Webhook Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
