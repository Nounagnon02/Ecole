<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TransactionPaiement;
use App\Services\CinetPayService;
use Illuminate\Support\Facades\Log;

class CinetPayController extends Controller
{
    protected CinetPayService $cinetpay;

    public function __construct(CinetPayService $cinetpay)
    {
        $this->cinetpay = $cinetpay;
    }

    /**
     * 1. Initialiser la transaction et obtenir l’URL de paiement
     * Route: POST /api/cinetpay/init/{transaction_id}
     */
    public function initier(Request $request)
    {
        // Valider les données de création de transaction
        $data = $request->validate([
            'paiement_eleve_id' => 'required|exists:paiement_eleves,id',
            'tranche'           => 'required|string|in:PREMIERE,DEUXIEME,TROISIEME,INTEGRAL',
            'montant_paye'      => 'required|numeric',
        ]);
        // Créer une nouvelle transaction
        $tx = TransactionPaiement::create([
            'id_paiement_eleve'       => $data['paiement_eleve_id'],
            'tranche'                 => $data['tranche'],
            'montant_paye'            => $data['montant_paye'],
            'date_paiement'           => now(),
            'statut'                  => 'EN_ATTENTE',
            'methode_paiement'        => 'MOBILE_MONEY',
            'recu_par'                => 'Système CinetPay',
        ]);

        // Préparer le payload pour le service CinetPay
        $payload = [
            'transaction_id' => 'TX-' . $tx->id . '-' . time(),
            'amount'         => $tx->montant_paye,
            'description'    => "Paiement écolage pour {$tx->paiementEleve->eleve->nom} {$tx->paiementEleve->eleve->prenom}",
            'customer_name'  => trim("{$tx->paiementEleve->eleve->nom} {$tx->paiementEleve->eleve->prenom}"),
            'customer_email' => $tx->paiementEleve->eleve->email ?? 'parent@example.com',
            'customer_phone' => $tx->paiementEleve->eleve->numero_de_telephone,
            // 'channels'     => ['ALL'], // Optionnel : définir les canaux si nécessaire
        ];

        // Générer le lien de paiement
        $result = $this->cinetpay->initiate($payload);

        // Sauvegarder le token et l'URL en base
        $tx->update([
            'cinetpay_transaction_id' => $result['transaction_id'],
            'cinetpay_payment_url'    => $result['payment_url'],
            'statut'                  => 'EN_ATTENTE',
        ]);

        return response()->json(['payment_url' => $result['payment_url']]);
    }

    /**
     * 2. Retour après paiement (GET)
     */
    public function retour(Request $request)
    {
        $status = $request->get('status');
        return view('paiement.retour', compact('status'));
    }

    /**
     * 3. Notification serveur-à-serveur (POST) – CRITIQUE
     */
    public function notifier(Request $request)
    {
        $data = $request->all();

        // Vérifier la signature envoyée par CinetPay
        if (! $this->cinetpay->verifySignature($data)) {
            Log::warning('CinetPay invalid signature', $data);
            return response('Invalid signature', 400);
        }

        // Vérifier le résultat de la transaction
        if (($data['cpm_result'] ?? '') === '00' && ($data['cpm_trans_status'] ?? '') === 'ACCEPTED') {
            // Récupérer la transaction en base
            $tx = TransactionPaiement::where('cinetpay_transaction_id', $data['cpm_trans_id'])->first();

            if ($tx && $tx->statut !== 'PAYE') {
                $tx->update(['statut' => 'PAYE', 'date_paiement' => now()]);
                $this->mettreAJourPaiementEleve($tx);
            }
        }

        return response('OK', 200);
    }

    /**
     * 4. Mise à jour des montants et statuts de PaiementEleve et StatutTranche
     */
    private function mettreAJourPaiementEleve(TransactionPaiement $tx)
    {
        $paiement = $tx->paiementEleve;
        $paiement->montant_total_paye += $tx->montant_paye;
        $paiement->montant_restant    = $paiement->contribution->montant - $paiement->montant_total_paye;

        $paiement->statut_global = $paiement->montant_restant <= 0 ? 'TERMINE' : 'EN_COURS';
        $paiement->save();

        // Mettre à jour la tranche correspondante
        $tranche = \App\Models\StatutTranche::where('id_paiement_eleve', $paiement->id)
                                              ->where('tranche', $tx->tranche)
                                              ->first();
        if ($tranche) {
            $tranche->update(['statut' => 'PAYE', 'date_paiement' => now()]);
        }
    }
}
