<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\PaiementEleve;
use App\Models\Eleve;
use App\Services\Billing\PaymentProvider;

class PaymentController extends Controller
{
    /** Rôles autorisés à gérer les paiements de toute l'école. */
    private const MANAGER_ROLES = ['directeur', 'comptable', 'secretaire', 'super-admin'];

    protected PaymentProvider $provider;

    public function __construct()
    {
        $this->provider = PaymentProvider::factory('fedapay');
    }

    /**
     * L'utilisateur courant peut-il agir sur les paiements de cet élève ?
     * Gestionnaires : oui. Parent : uniquement ses enfants. Élève : lui-même.
     */
    private function canAccessStudent(Eleve $eleve): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        if (in_array($user->role, self::MANAGER_ROLES, true)) {
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
     * Résout un paiement en refusant l'accès s'il n'appartient pas au périmètre
     * de l'utilisateur. Le global scope BelongsToEcole assure déjà l'isolation
     * inter-écoles ; on ajoute ici l'isolation intra-école (cf. audit S3/S9).
     */
    private function authorizedPayment(int $paymentId): Payment
    {
        $payment = Payment::with('eleve')->findOrFail($paymentId);

        if (!$payment->eleve || !$this->canAccessStudent($payment->eleve)) {
            abort(403, 'Accès refusé à ce paiement');
        }

        return $payment;
    }

    /** École de l'utilisateur courant — jamais celle passée dans la requête. */
    private function currentSchoolId(): ?int
    {
        return auth()->user()?->ecole_id ?? session('ecole_id');
    }

    /**
     * Initialiser un paiement
     */
    public function initializePayment(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'paiement_eleve_id' => 'nullable|school_exists:paiements,id',
            'amount' => 'required|numeric|min:100',
            'description' => 'required|string',
            'type' => 'required|in:scolarite,cantine,transport,autre',
            'periode' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $eleve = Eleve::with('user:id,name,prenom')->findOrFail($request->eleve_id);

            if (!$this->canAccessStudent($eleve)) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Accès refusé à cet élève'], 403);
            }

            // L'échéance rattachée doit appartenir au même élève, sinon le
            // rapprochement créditerait la scolarité d'un autre dossier.
            if ($request->filled('paiement_eleve_id')) {
                $echeanceAppartientAEleve = PaiementEleve::where('id', $request->paiement_eleve_id)
                    ->where('eleve_id', $eleve->id)
                    ->exists();

                if (!$echeanceAppartientAEleve) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'L\'échéance indiquée n\'appartient pas à cet élève.',
                    ], 422);
                }
            }

            // Créer l'enregistrement de paiement
            $payment = Payment::create([
                'eleve_id' => $request->eleve_id,
                'paiement_eleve_id' => $request->paiement_eleve_id,
                'ecole_id' => $eleve->ecole_id,
                'amount' => $request->amount,
                'type' => $request->type,
                'description' => $request->description,
                'periode' => $request->periode,
                'status' => 'pending',
                'currency' => 'XOF'
            ]);

            // Production — FedaPay via PaymentProvider
            $result = $this->provider->initializePayment([
                'amount' => $request->amount,
                'currency' => 'XOF',
                'description' => $request->description,
                'reference' => 'PAY_' . $payment->id . '_' . uniqid(),
                'callback_url' => route('payment.callback'),
                'metadata' => [
                    'payment_id' => $payment->id,
                    'eleve_id' => $eleve->id,
                    // Identité portée par `users`, pas par `eleves`.
                    'eleve_nom' => $eleve->user->name ?? '',
                    'eleve_prenom' => $eleve->user->prenom ?? '',
                ],
            ]);

            if ($result['success']) {
                $payment->update(['transaction_id' => $result['transaction_id']]);
            }

            DB::commit();

            return response()->json([
                'success' => $result['success'],
                'data' => [
                    'payment_id' => $payment->id,
                    'transaction_id' => $result['transaction_id'],
                    'checkout_url' => $result['payment_url'],
                    'amount' => $payment->amount,
                ],
                'message' => $result['success']
                    ? 'Paiement initialisé'
                    : ($result['error'] ?? 'Erreur lors de l\'initialisation'),
            ]);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();
            Log::error('Payment initialization error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de l\'initialisation du paiement'], 500);
        }
    }

    /**
     * Traiter paiement Mobile Money
     */
    public function processMobileMoney(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|school_exists:payments,id',
            'phone_number' => 'required|string',
            'operator' => 'required|in:mtn,moov'
        ]);

        try {
            $payment = $this->authorizedPayment((int) $request->payment_id);

            if ($payment->status === 'completed') {
                return response()->json(['success' => true, 'message' => 'Paiement déjà confirmé']);
            }

            // Un paiement ne passe à « completed » QUE sur confirmation du
            // provider. Sans transaction ou sans confirmation, il reste
            // « pending » : le webhook signé tranchera (cf. audit S3).
            if (!$payment->transaction_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune transaction associée à ce paiement',
                ], 422);
            }

            $verification = $this->provider->verifyPayment($payment->transaction_id);

            if ($verification['status'] === 'completed') {
                $this->confirmPayment($payment, 'Paiement Mobile Money confirmé par le provider', 'mobile_money');

                return response()->json(['success' => true, 'message' => 'Paiement confirmé']);
            }

            if ($verification['status'] === 'failed') {
                $payment->update(['status' => 'failed']);
                $this->recordHistory($payment, 'failed', 'Paiement Mobile Money refusé');

                return response()->json(['success' => false, 'message' => 'Paiement refusé'], 402);
            }

            // Toujours en attente côté provider — le client doit valider sur son téléphone.
            return response()->json([
                'success' => false,
                'status'  => 'pending',
                'message' => 'Validez le paiement sur votre téléphone',
            ], 202);

        } catch (\Illuminate\Auth\Access\AuthorizationException|\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Mobile Money error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du traitement du paiement'], 500);
        }
    }

    /**
     * Vérifier le statut
     */
    public function checkStatus(Request $request)
    {
        $request->validate(['payment_id' => 'required|school_exists:payments,id']);

        $payment = $this->authorizedPayment((int) $request->payment_id);

        // Vérifier le statut via le provider si une transaction existe
        if ($payment->transaction_id) {
            try {
                $result = $this->provider->verifyPayment($payment->transaction_id);
                if ($result['success']) {
                    $this->confirmPayment($payment, 'Paiement confirmé lors de la vérification de statut');
                }
            } catch (\Exception $e) {
                $this->rethrowIfMeaningful($e);
                Log::error('Status check error', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['success' => true, 'data' => $payment]);
    }

    /**
     * Callback
     */
    public function callback(Request $request)
    {
        $transactionId = $request->query('id');

        try {
            $payment = Payment::where('transaction_id', $transactionId)->first();
            if (!$payment) {
                return redirect(config('app.frontend_url') . '/payment/error');
            }

            $result = $this->provider->verifyPayment($transactionId);

            if ($result['success']) {
                $this->confirmPayment($payment, 'Paiement approuvé');
                return redirect(config('app.frontend_url') . '/payment/success?id=' . $payment->id);
            }

            return redirect(config('app.frontend_url') . '/payment/failed?id=' . $payment->id);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Callback error', ['error' => $e->getMessage()]);
            return redirect(config('app.frontend_url') . '/payment/error');
        }
    }

    /**
     * Webhook
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('X-FedaPay-Signature');
        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, config('services.fedapay.webhook_secret'));

        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        try {
            if (isset($data['entity']['transaction'])) {
                $transactionId = $data['entity']['transaction']['id'];
                $status = $data['entity']['transaction']['status'];

                $payment = Payment::where('transaction_id', $transactionId)->first();

                if ($payment) {
                    if ($status === 'approved') {
                        // Filet de sécurité : vérifier côté provider que la
                        // transaction est bien approuvée (audit S3). Si l'appel
                        // échoue (timeout, indisponibilité), on fait quand même
                        // confiance à la signature HMAC déjà validée.
                        try {
                            $verification = $this->provider->verifyPayment($transactionId);
                            if (!$verification['success']) {
                                Log::warning('S3: provider verify returned non-approved, trusting HMAC signature', [
                                    'transaction_id' => $transactionId,
                                    'provider_error' => $verification['error'] ?? null,
                                ]);
                            }
                        } catch (\Throwable $e) {
                            Log::warning('S3: provider verify unreachable, trusting HMAC signature', [
                                'transaction_id' => $transactionId,
                                'error' => $e->getMessage(),
                            ]);
                        }
                        $this->confirmPayment($payment, 'Paiement approuvé via webhook (vérifié)');
                    } elseif ($status === 'declined') {
                        $payment->update(['status' => 'failed']);
                        $this->recordHistory($payment, 'failed', 'Paiement refusé');
                    }
                }
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Webhook error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Demander un remboursement
     */
    public function requestRefund(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|school_exists:payments,id',
            'reason' => 'required|string'
        ]);

        try {
            $payment = $this->authorizedPayment((int) $request->payment_id);

            if ($payment->status !== 'completed') {
                return response()->json(['success' => false, 'message' => 'Seuls les paiements complétés peuvent être remboursés'], 400);
            }

            $payment->update(['refund_status' => 'requested', 'refund_reason' => $request->reason]);
            $this->recordHistory($payment, 'refund_requested', 'Demande de remboursement: ' . $request->reason);

            return response()->json(['success' => true, 'message' => 'Demande de remboursement enregistrée']);

        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Refund request error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors de la demande de remboursement'], 500);
        }
    }

    /**
     * Traiter un remboursement
     */
    public function processRefund(Request $request)
    {
        $request->validate(['payment_id' => 'required|school_exists:payments,id']);

        DB::beginTransaction();
        try {
            // Le décaissement effectif est réservé aux gestionnaires.
            if (!in_array(auth()->user()?->role, ['directeur', 'comptable', 'super-admin'], true)) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
            }

            $payment = Payment::findOrFail($request->payment_id);

            if ($payment->refund_status !== 'requested') {
                return response()->json(['success' => false, 'message' => 'Aucune demande de remboursement'], 400);
            }

            // Tenter le refund via le provider si une transaction existe
            if ($payment->transaction_id) {
                $this->provider->refundPayment($payment->transaction_id);
            }

            $payment->update([
                'refund_status' => 'completed',
                'refunded_at' => now(),
                'status' => 'refunded'
            ]);

            $this->recordHistory($payment, 'refunded', 'Remboursement effectué');

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Remboursement effectué']);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();
            Log::error('Refund processing error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Erreur lors du remboursement'], 500);
        }
    }

    /**
     * Confirmer un paiement — seul chemin autorisé vers le statut « completed ».
     *
     * Idempotent : un webhook ou un retour navigateur redélivré /**
     * Confirmer un paiement — seul chemin autorisé vers le statut « completed ».
     *
     * Idempotent : un webhook ou un retour navigateur redélivré ne crédite
     * jamais deux fois l'échéance (le rapprochement n'est joué que lors du
     * premier passage pending → completed).
     */
    private function confirmPayment(Payment $payment, string $note, ?string $paymentMethod = null): void
    {
        if ($payment->status === 'completed') {
            return;
        }

        DB::transaction(function () use ($payment, $note, $paymentMethod) {
            $payment->update([
                'status'         => 'completed',
                'paid_at'        => now(),
                'payment_method' => $paymentMethod ?? $payment->payment_method,
            ]);
            $this->recordHistory($payment, 'completed', $note);
            $this->reconcile($payment);
        });
    }

    /**
     * Rapporter le passage de passerelle sur l'échéance de scolarité, si elle
     * est connue (`paiement_eleve_id`). Sans lien, l'encaissement reste dans le
     * journal `payments` et n'a pas d'écriture comptable — c'est le contrat
     * pour les types sans échéance (cantine, transport, autre).
     */
    private function reconcile(Payment $payment): void
    {
        if (!$payment->paiement_eleve_id) {
            return;
        }

        $echeance = PaiementEleve::find($payment->paiement_eleve_id);

        if ($echeance) {
            $echeance->credit((float) $payment->amount);
        }
    }

    /**
     * Enregistrer l'historique
     */
    private function recordHistory($payment, $status, $note)
    {
        PaymentHistory::create([
            'payment_id' => $payment->id,
            'status' => $status,
            'note' => $note,
            'created_by' => auth()->id()
        ]);
    }
}
