<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\CinetPayService;
use App\Models\PaiementEleve;
use App\Models\Eleves;
use App\Models\StatutTranche;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected $cinetPayService;

    public function __construct(CinetPayService $cinetPayService)
    {
        $this->cinetPayService = $cinetPayService;
    }

    

    /**
     * Initier un paiement pour une tranche
     */
    public function initiatePayment(Request $request)
    {
        Log::info('Initiate Payment Request:', $request->all());
        
        $request->validate([
            'paiement_eleve_id' => 'required|exists:paiement_eleves,id',
            'tranche' => 'required|in:PREMIERE,DEUXIEME,TROISIEME,INTEGRAL'
        ]);

        try {
                $paiementEleve = PaiementEleve::with(['eleve', 'contribution'])->find($request->paiement_eleve_id);
                
                // Vérifier que la tranche peut être payée
                if ($request->tranche !== 'INTEGRAL') {
                    $statutTranche = StatutTranche::where('id_paiement_eleve', $paiementEleve->id)
                                                ->where('tranche', $request->tranche)
                                                ->first();
                    
                    if (!$statutTranche || $statutTranche->statut === 'PAYE') {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cette tranche ne peut pas être payée'
                        ], 400);
                    }
                    
                    $montant = $statutTranche->montant_tranche;
                } else {
                    $montant = $paiementEleve->montant_restant;
                }

                // Informations de l'élève
                $eleveInfo = [
                    'nom' => $paiementEleve->eleve->nom,
                    'prenom' => $paiementEleve->eleve->prenom,
                    'email' => $paiementEleve->eleve->email,
                    'telephone' => $paiementEleve->eleve->telephone
                ];

                // Initier le paiement
                $paymentResult = $this->cinetPayService->initiatePayment(
                    $paiementEleve,
                    $request->tranche,
                    $montant,
                    $eleveInfo
                );

                if ($paymentResult['success']) {
                    return response()->json([
                        'success' => true,
                        'payment_url' => $paymentResult['payment_url'],
                        'transaction_id' => $paymentResult['transaction_id']
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => $paymentResult['message']
                    ], 500);
                }

            } catch (\Exception $e) {
            Log::error('Payment Initiation Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initiation du paiement'
            ], 500);
        }
    }

    /**
     * Page de retour après paiement
     */
    public function paymentReturn(Request $request)
    {
        $transactionId = $request->get('transaction_id');
        
        if (!$transactionId) {
            return redirect()->route('dashboard')->with('error', 'Transaction non trouvée');
        }

        // Vérifier le statut du paiement
        $statusResult = $this->cinetPayService->checkPaymentStatus($transactionId);
        
        if ($statusResult['success']) {
            if ($statusResult['status'] === 'ACCEPTED') {
                return redirect()->route('dashboard')->with('success', 'Paiement effectué avec succès');
            } else {
                return redirect()->route('dashboard')->with('error', 'Paiement échoué ou annulé');
            }
        } else {
            return redirect()->route('dashboard')->with('error', 'Impossible de vérifier le statut du paiement');
        }
    }

    /**
     * Webhook pour les notifications CinetPay
     */
    public function paymentNotify(Request $request)
    {
        try {
            $data = $request->all();
            
            // Vérifier la signature
            if (!$this->cinetPayService->verifySignature($data)) {
                Log::warning('Signature invalide pour notification CinetPay', $data);
                return response('Signature invalide', 400);
            }

            // Traiter le paiement si accepté
            if ($data['cpm_result'] === '00') {
                $result = $this->cinetPayService->processSuccessfulPayment($data['cpm_trans_id'], $data);
                
                if ($result['success']) {
                    Log::info('Paiement traité avec succès', ['transaction_id' => $data['cpm_trans_id']]);
                    return response('OK', 200);
                } else {
                    Log::error('Erreur traitement paiement', ['error' => $result['error']]);
                    return response('Erreur traitement', 500);
                }
            } else {
                Log::info('Paiement échoué', ['transaction_id' => $data['cpm_trans_id'], 'result' => $data['cpm_result']]);
                return response('Paiement échoué', 200);
            }

        } catch (\Exception $e) {
            Log::error('Erreur notification CinetPay: ' . $e->getMessage());
            return response('Erreur serveur', 500);
        }
    }

    /**
     * Obtenir les tranches disponibles pour un paiement
     */
    public function getAvailableTranches($paiementEleveId)
    {
        try {
            $paiementEleve = PaiementEleve::with(['contribution', 'statutsTranches'])->find($paiementEleveId);
            
            if (!$paiementEleve) {
                return response()->json(['success' => false, 'message' => 'Paiement non trouvé'], 404);
            }

            $tranches = [];
            
            // Vérifier chaque tranche
            foreach ($paiementEleve->statutsTranches as $statut) {
                if ($statut->statut === 'EN_ATTENTE') {
                    $tranches[] = [
                        'tranche' => $statut->tranche,
                        'montant' => $statut->montant_tranche,
                        'date_limite' => $statut->date_limite->format('Y-m-d'),
                        'est_en_retard' => $statut->est_en_retard
                    ];
                }
            }

            // Ajouter l'option paiement intégral si du montant reste
            if ($paiementEleve->montant_restant > 0) {
                $tranches[] = [
                    'tranche' => 'INTEGRAL',
                    'montant' => $paiementEleve->montant_restant,
                    'date_limite' => null,
                    'est_en_retard' => false
                ];
            }

            return response()->json([
                'success' => true,
                'tranches' => $tranches,
                'montant_total_paye' => $paiementEleve->montant_total_paye,
                'montant_restant' => $paiementEleve->montant_restant
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération tranches: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Historique des paiements d'un élève
     */
    public function getPaymentHistory($eleveId)
    {
        try {
            $paiements = PaiementEleve::with(['transactions', 'contribution'])
                                   ->where('id_eleve', $eleveId)
                                   ->get();

            return response()->json([
                'success' => true,
                'paiements' => $paiements
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur historique paiements: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }
}