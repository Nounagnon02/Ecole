<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\FedaPayService;
use App\Models\TransactionPaiement;
use Illuminate\Support\Facades\Log;

class FedaPayController extends Controller
{
    protected $fedapayService;

    public function __construct(FedaPayService $fedapayService)
    {
        $this->fedapayService = $fedapayService;
    }

    /**
     * Initialiser un paiement via FedaPay
     * POST /api/fedapay/init/{paiement_eleve_id}
     */
    public function initier(Request $request, $paiement_eleve_id)
    {
        try {
            // Ici, vous devriez récupérer les infos du PaiementEleve via ID
            // Pour l'exemple, on mock ou on suppose que l'ID est passé et valide
            $paiementEleve = \App\Models\PaiementEleve::with('eleve')->findOrFail($paiement_eleve_id);
            
            // Calcul du montant à payer (exemple: tranche ou solde)
            // Simplification : on prend le montant envoyé ou un défaut
            $amount = $request->input('amount', 5000); // Montant par défaut pour test

            // Création de la transaction en base locale
            $tx = TransactionPaiement::create([
                'id_paiement_eleve' => $paiementEleve->id,
                'montant_paye' => $amount,
                'date_paiement' => now(),
                'statut' => 'EN_ATTENTE',
                'methode_paiement' => 'FEDAPAY',
                'recu_par' => 'Système FedaPay'
            ]);

            // Appel au service FedaPay
            $result = $this->fedapayService->createTransaction([
                'description' => "Paiement Scolarité - " . $paiementEleve->eleve->nom,
                'amount' => $amount,
                'customer_firstname' => $paiementEleve->eleve->prenom,
                'customer_lastname' => $paiementEleve->eleve->nom,
                'customer_email' => $paiementEleve->eleve->email ?? 'parent@ecole.pj',
                'customer_phone' => $paiementEleve->eleve->telephone ?? '99999999'
            ]);

            // Mise à jour avec l'ID FedaPay
            $tx->update([
                'cinetpay_transaction_id' => $result['transaction']->id, // On réutilise la colonne ou nouvelle colonne
                'cinetpay_payment_url' => $result['payment_url']
            ]);

            return response()->json([
                'success' => true,
                'payment_url' => $result['payment_url']
            ]);

        } catch (\Exception $e) {
            Log::error('FedaPay Init Controller Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Webhook ou Callback pour FedaPay
     */
    public function callback(Request $request)
    {
        $transactionId = $request->input('id');
        // $signature = $request->header('X-FedaPay-Signature'); // Pour la vérification future

        Log::info("FedaPay Callback: Transaction $transactionId");

        try {
            // 1. Vérifier la transaction auprès de FedaPay (Source de vérité)
            $transaction = $this->fedapayService->verifyTransaction($transactionId);

            if ($transaction && $transaction->status === 'approved') {
                // 2. Retrouver notre transaction locale
                $tx = TransactionPaiement::where('cinetpay_transaction_id', $transactionId)->first();

                if ($tx && $tx->statut !== 'PAYE') {
                    // 3. Mise à jour atomique
                    \DB::transaction(function () use ($tx) {
                        // A. Marquer la transaction comme PAYÉE
                        $tx->update([
                            'statut' => 'PAYE',
                            'date_paiement' => now()
                        ]);

                        // B. Mettre à jour le solde de l'élève
                        $this->updatePaiementEleve($tx);
                    });

                    Log::info("Paiement validé et solde mis à jour pour Transaction $transactionId");
                }
            }
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement du Webhook FedaPay: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }

        return response()->json(['received' => true]);
    }

    /**
     * Logique métier : Mise à jour du solde de l'élève
     */
    protected function updatePaiementEleve(TransactionPaiement $tx)
    {
        $paiementEleve = $tx->paiementEleve;

        if ($paiementEleve) {
            // Recalculer le montant total payé
            $paiementEleve->montant_total_paye += $tx->montant_paye;
            
            // Recalculer le reste à payer (basé sur la contribution totale)
             if ($paiementEleve->contribution) {
                $paiementEleve->montant_restant = $paiementEleve->contribution->montant - $paiementEleve->montant_total_paye;
            } else {
                // Fallback si pas de relation contribution chargée ou existante
                $paiementEleve->montant_restant -= $tx->montant_paye; 
            }

            // Mettre à jour le statut global
            if ($paiementEleve->montant_restant <= 0) {
                $paiementEleve->statut_global = 'TERMINE';
                $paiementEleve->montant_restant = 0; // Eviter les négatifs
            } else {
                $paiementEleve->statut_global = 'EN_COURS';
            }

            $paiementEleve->save();
        }
    }
}
