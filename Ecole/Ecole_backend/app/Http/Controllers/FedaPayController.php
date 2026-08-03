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
     * L'utilisateur courant peut-il ouvrir un paiement pour cet élève ?
     */
    private function canPayFor(Eleve $eleve): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        if (in_array($user->role, ['directeur', 'comptable', 'secretaire', 'super-admin'], true)) {
            return true;
        }

        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $eleve->id)->exists() ?? false;
        }

        if ($user->role === 'eleve') {
            return $user->eleve?->id === $eleve->id;
        }

        return false;
    }

    /**
     * Initialiser un paiement via FedaPay
     * POST /api/fedapay/init/{eleve_id}
     */
    public function initier(Request $request, $eleve_id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:10000000',
        ]);

        try {
            $eleve = Eleve::with('user')->findOrFail($eleve_id);

            // Sans ce contrôle, tout compte authentifié pouvait ouvrir une
            // transaction au nom de n'importe quel élève (cf. audit S12).
            if (!$this->canPayFor($eleve)) {
                return response()->json(['success' => false, 'message' => 'Accès refusé à cet élève'], 403);
            }

            $amount = (float) $request->input('amount');

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
            return response()->json(['success' => false, 'message' => 'Erreur lors de l\'initialisation du paiement'], 500);
        }
    }

    /**
     * Retour navigateur après paiement — vérifie puis redirige vers le front.
     * GET /api/fedapay/callback?id=...
     */
    public function callback(Request $request)
    {
        $frontend = config('app.frontend_url') ?? config('app.url');
        $transactionId = $request->query('id');

        if (!$transactionId) {
            return redirect($frontend . '/payment/error');
        }

        $this->syncTransaction((string) $transactionId);

        $tx = TransactionPaiement::where('cinetpay_transaction_id', $transactionId)->first();

        if ($tx && $tx->statut === 'PAYE') {
            return redirect($frontend . '/payment/success?id=' . $tx->id);
        }

        return redirect($frontend . '/payment/failed');
    }

    /**
     * Webhook pour FedaPay
     *
     * La charge utile n'est pas digne de confiance : on ne lit que
     * l'identifiant de transaction, puis on interroge FedaPay pour connaître
     * le vrai statut. Quand un secret est configuré, la signature HMAC est
     * vérifiée en amont (cf. audit S11).
     */
    public function webhook(Request $request)
    {
        $secret = config('billing.fedapay.webhook_secret');

        if ($secret) {
            $signature = (string) $request->header('X-FEDAPAY-SIGNATURE');
            $attendue = hash_hmac('sha256', $request->getContent(), $secret);

            if (!hash_equals($attendue, $signature)) {
                Log::warning('FedaPay webhook: signature invalide', ['ip' => $request->ip()]);

                return response()->json(['error' => 'Invalid signature'], 401);
            }
        }

        $transactionId = $request->input('id');

        try {
            $this->syncTransaction((string) $transactionId);

            return response()->json(['received' => true]);
        } catch (\Exception $e) {
            Log::error('Webhook Error: ' . $e->getMessage());

            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Interroge FedaPay et applique le statut réel à la transaction locale.
     * Partagé par le webhook et le retour navigateur.
     */
    private function syncTransaction(string $transactionId): void
    {
        $transaction = $this->fedapayService->verifyTransaction($transactionId);

        if (!$transaction || $transaction->status !== 'approved') {
            return;
        }

        $tx = TransactionPaiement::where('cinetpay_transaction_id', $transactionId)
            ->with('eleve.user')
            ->first();

        if (!$tx || $tx->statut === 'PAYE') {
            return;
        }

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
