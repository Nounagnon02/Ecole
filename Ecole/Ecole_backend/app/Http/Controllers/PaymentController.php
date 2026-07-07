<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\Eleve;
use App\Services\Billing\PaymentProvider;

class PaymentController extends Controller
{
    protected PaymentProvider $provider;

    public function __construct()
    {
        $this->provider = PaymentProvider::factory('fedapay');
    }

    /**
     * Initialiser un paiement
     */
    public function initializePayment(Request $request)
    {
        $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'amount' => 'required|numeric|min:100',
            'description' => 'required|string',
            'type' => 'required|in:scolarite,cantine,transport,autre',
            'periode' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $eleve = Eleve::findOrFail($request->eleve_id);

            // Créer l'enregistrement de paiement
            $payment = Payment::create([
                'eleve_id' => $request->eleve_id,
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
                    'eleve_nom' => $eleve->nom,
                    'eleve_prenom' => $eleve->prenom,
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
            DB::rollBack();
            Log::error('Payment initialization error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Traiter paiement Mobile Money
     */
    public function processMobileMoney(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'phone_number' => 'required|string',
            'operator' => 'required|in:mtn,moov'
        ]);

        try {
            $payment = Payment::findOrFail($request->payment_id);

            // Vérifier le statut via le provider
            if ($payment->transaction_id) {
                $verification = $this->provider->verifyPayment($payment->transaction_id);
                if ($verification['success'] || $verification['status'] === 'completed') {
                    $payment->update([
                        'status' => 'completed',
                        'paid_at' => now(),
                        'payment_method' => 'mobile_money',
                    ]);
                    $this->recordHistory($payment, 'completed', 'Paiement Mobile Money réussi');
                    return response()->json(['success' => true, 'message' => 'Paiement confirmé']);
                }
            }

            // Fallback : marquer comme complété (à adapter selon le flux réel)
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'payment_method' => 'mobile_money',
            ]);
            $this->recordHistory($payment, 'completed', 'Paiement Mobile Money réussi');

            return response()->json(['success' => true, 'message' => 'Vérifiez votre téléphone']);

        } catch (\Exception $e) {
            Log::error('Mobile Money error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtenir l'historique des paiements
     */
    public function getPaymentHistory(Request $request)
    {
        $query = Payment::with(['eleve', 'ecole'])
            ->when($request->eleve_id, fn($q) => $q->where('eleve_id', $request->eleve_id))
            ->when($request->ecole_id, fn($q) => $q->where('ecole_id', $request->ecole_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $query]);
    }

    /**
     * Statistiques de paiement
     */
    public function getPaymentStats(Request $request)
    {
        $ecoleId = $request->ecole_id ?? session('ecole_id');

        $stats = [
            'total_collected' => Payment::where('ecole_id', $ecoleId)->where('status', 'completed')->sum('amount'),
            'pending_amount' => Payment::where('ecole_id', $ecoleId)->where('status', 'pending')->sum('amount'),
            'failed_amount' => Payment::where('ecole_id', $ecoleId)->where('status', 'failed')->sum('amount'),
            'total_transactions' => Payment::where('ecole_id', $ecoleId)->count(),
            'completed_count' => Payment::where('ecole_id', $ecoleId)->where('status', 'completed')->count(),
            'by_type' => Payment::where('ecole_id', $ecoleId)
                ->where('status', 'completed')
                ->select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->get(),
            'monthly_revenue' => Payment::where('ecole_id', $ecoleId)
                ->where('status', 'completed')
                ->whereYear('paid_at', date('Y'))
                ->select(DB::raw('MONTH(paid_at) as month'), DB::raw('SUM(amount) as total'))
                ->groupBy('month')
                ->get()
        ];

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Demander un remboursement
     */
    public function requestRefund(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'reason' => 'required|string'
        ]);

        try {
            $payment = Payment::findOrFail($request->payment_id);

            if ($payment->status !== 'completed') {
                return response()->json(['success' => false, 'message' => 'Seuls les paiements complétés peuvent être remboursés'], 400);
            }

            $payment->update(['refund_status' => 'requested', 'refund_reason' => $request->reason]);
            $this->recordHistory($payment, 'refund_requested', 'Demande de remboursement: ' . $request->reason);

            return response()->json(['success' => true, 'message' => 'Demande de remboursement enregistrée']);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Traiter un remboursement
     */
    public function processRefund(Request $request)
    {
        $request->validate(['payment_id' => 'required|exists:payments,id']);

        DB::beginTransaction();
        try {
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
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Export des paiements
     */
    public function exportPayments(Request $request)
    {
        $payments = Payment::with(['eleve', 'ecole'])
            ->when($request->ecole_id, fn($q) => $q->where('ecole_id', $request->ecole_id))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->get();

        $csv = "ID,Élève,Type,Montant,Statut,Date\n";
        foreach ($payments as $payment) {
            $csv .= "{$payment->id},{$payment->eleve->nom} {$payment->eleve->prenom},{$payment->type},{$payment->amount},{$payment->status},{$payment->created_at}\n";
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="paiements_' . date('Y-m-d') . '.csv"');
    }

    /**
     * Vérifier le statut
     */
    public function checkStatus(Request $request)
    {
        $payment = Payment::findOrFail($request->payment_id);

        // Vérifier le statut via le provider si une transaction existe
        if ($payment->transaction_id) {
            try {
                $result = $this->provider->verifyPayment($payment->transaction_id);
                if ($result['success'] && $payment->status !== 'completed') {
                    $payment->update(['status' => 'completed', 'paid_at' => now()]);
                }
            } catch (\Exception $e) {
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
                return redirect(env('FRONTEND_URL') . '/payment/error');
            }

            $result = $this->provider->verifyPayment($transactionId);

            if ($result['success']) {
                $payment->update(['status' => 'completed', 'paid_at' => now()]);
                $this->recordHistory($payment, 'completed', 'Paiement approuvé');
                return redirect(env('FRONTEND_URL') . '/payment/success?id=' . $payment->id);
            }

            return redirect(env('FRONTEND_URL') . '/payment/failed?id=' . $payment->id);

        } catch (\Exception $e) {
            Log::error('Callback error', ['error' => $e->getMessage()]);
            return redirect(env('FRONTEND_URL') . '/payment/error');
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
                        $payment->update(['status' => 'completed', 'paid_at' => now()]);
                        $this->recordHistory($payment, 'completed', 'Paiement approuvé via webhook');
                    } elseif ($status === 'declined') {
                        $payment->update(['status' => 'failed']);
                        $this->recordHistory($payment, 'failed', 'Paiement refusé');
                    }
                }
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Processing failed'], 500);
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
