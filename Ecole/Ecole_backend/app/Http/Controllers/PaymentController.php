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
use App\Models\TransactionPaiement;

class PaymentController extends Controller
{
    protected $cinetPayService;

    public function __construct(CinetPayService $cinetPayService)
    {
        $this->cinetPayService = $cinetPayService;
    }

    

    public function initiatePayment(Request $request)
    {
        $request->validate([
            'paiement_eleve_id' => 'required|exists:paiement_eleves,id',
            'tranche'           => 'required|in:PREMIERE,DEUXIEME,TROISIEME,INTEGRAL',
        ]);

        try {
            $pe   = PaiementEleve::with('eleve')->findOrFail($request->paiement_eleve_id);
            $mont = $request->tranche === 'INTEGRAL'
                ? $pe->montant_restant
                : optional($pe->statutsTranches()
                    ->where('tranche', $request->tranche)
                    ->first())->montant_tranche;

            if (!$mont || $mont <= 0) {
                return response()->json(['success' => false, 'message' => 'Montant invalide'], 400);
            }

            $payload = [
                'amount'         => $mont,
                'description'    => "Frais scolaires – {$request->tranche}",
                'customer_name'  => trim($pe->eleve->nom . ' ' . $pe->eleve->prenom),
                'customer_email' => $pe->eleve->email ?? 'no-reply@school.com',
                'customer_phone' => $pe->eleve->telephone ?? '0000000000',
            ];

            $result = $this->cinetPayService->initiate($payload);

            TransactionPaiement::create([
                'id_paiement_eleve'   => $pe->id,
                'tranche'             => $request->tranche,
                'montant_paye'        => $mont,
                'date_paiement'       => now(),
                'statut'              => 'EN_ATTENTE',
                'methode_paiement'    => 'MOBILE_MONEY',
                'reference_transaction'=> $result['transaction_id'],
            ]);

            return response()->json($result);

        } catch (\Throwable $e) {
            Log::error('CinetPay init failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function paymentNotify(Request $request)
    {
        try {
            if (!$this->cinetPayService->verifySignature($request->all())) {
                Log::warning('Invalid CinetPay signature');
                return response('KO', 400);
            }

            if ($request->cpm_result !== '00') {
                Log::info('CinetPay payment failed', ['data' => $request->all()]);
                return response('OK', 200);
            }

            $tx = TransactionPaiement::where('reference_transaction', $request->cpm_trans_id)->first();
            if (!$tx) return response('TX not found', 404);

            DB::transaction(function () use ($tx, $request) {
                $tx->update(['statut' => 'PAYE', 'date_paiement' => now()]);
                $pe = $tx->paiementEleve;
                $pe->increment('montant_total_paye', $tx->montant_paye);
                $pe->decrement('montant_restant',   $tx->montant_paye);

                if ($tx->tranche !== 'INTEGRAL') {
                    $pe->statutsTranches()
                    ->where('tranche', $tx->tranche)
                    ->update(['statut' => 'PAYE', 'date_paiement' => now()]);
                }
                $pe->statut_global = $pe->montant_restant <= 0 ? 'TERMINE' : 'EN_COURS';
                $pe->save();
            });

            return response('OK', 200);
        } catch (\Throwable $e) {
            Log::error('CinetPay IPN error', ['error' => $e->getMessage()]);
            return response('SERVER ERROR', 500);
        }
    }

    public function paymentReturn(Request $request)
    {
        $tx = TransactionPaiement::where('reference_transaction', $request->transaction_id)->first();
        if (!$tx) return response()->json(['success' => false, 'message' => 'Transaction introuvable']);

        $status = $this->cinetPayService->status($tx->reference_transaction);
        $tx->update(['statut' => $status['status'] === 'ACCEPTED' ? 'PAYE' : 'ANNULE']);

        return redirect(
            config('app.front_url') . '/payment-result?' . http_build_query([
                'status'          => $status['status'],
                'transaction_id'  => $tx->reference_transaction,
            ])
        );
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
                                   ->where('eleve_id', $eleveId)
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





















<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\TransactionPaiement;
use App\Models\PaiementEleve;

class CinetPayController extends Controller
{
    
}