<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;
use App\Models\PaymentHistory;
use App\Models\Eleve;
use FedaPay\FedaPay;
use FedaPay\Transaction;

class PaymentController extends Controller
{
    public function __construct()
    {
        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.environment'));
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

            // Mode sandbox - simulation
            if (config('services.fedapay.environment') === 'sandbox') {
                $payment->update(['transaction_id' => 'TEST_' . uniqid()]);
                
                DB::commit();
                return response()->json([
                    'success' => true,
                    'message' => 'Paiement initialisé (mode test)',
                    'data' => [
                        'payment_id' => $payment->id,
                        'transaction_id' => $payment->transaction_id,
                        'amount' => $payment->amount,
                        'checkout_url' => env('FRONTEND_URL') . '/payment/checkout?id=' . $payment->id
                    ]
                ]);
            }

            // Production - FedaPay
            $transaction = Transaction::create([
                'description' => $request->description,
                'amount' => $request->amount,
                'currency' => ['iso' => 'XOF'],
                'callback_url' => route('payment.callback'),
                'customer' => [
                    'firstname' => $eleve->prenom,
                    'lastname' => $eleve->nom,
                    'email' => $eleve->email ?? 'noreply@ecole.com',
                    'phone_number' => ['number' => $eleve->numero_telephone, 'country' => 'bj']
                ]
            ]);

            $payment->update(['transaction_id' => $transaction->id]);
            
            DB::commit();
            return response()->json([
                'success' => true,
                'data' => [
                    'payment_id' => $payment->id,
                    'transaction_id' => $transaction->id,
                    'checkout_url' => $transaction->generateToken()->url
                ]
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

            if (config('services.fedapay.environment') === 'sandbox') {
                sleep(2);
                $payment->update(['status' => 'completed', 'paid_at' => now(), 'payment_method' => 'mobile_money']);
                $this->recordHistory($payment, 'completed', 'Paiement Mobile Money réussi (test)');
                
                return response()->json(['success' => true, 'message' => 'Paiement réussi']);
            }

            $transaction = Transaction::retrieve($payment->transaction_id);
            $transaction->sendNow(['phone_number' => $request->phone_number, 'operator' => $request->operator]);
            
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
        
        if ($payment->transaction_id && config('services.fedapay.environment') !== 'sandbox') {
            try {
                $transaction = Transaction::retrieve($payment->transaction_id);
                if ($transaction->status === 'approved' && $payment->status !== 'completed') {
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

            $transaction = Transaction::retrieve($transactionId);
            
            if ($transaction->status === 'approved') {
                $payment->update(['status' => 'completed', 'paid_at' => now()]);
                $this->recordHistory($payment, 'completed', 'Paiement approuvé');
                return redirect(env('FRONTEND_URL') . '/payment/success?id=' . $payment->id);
            }

            return redirect(env('FRONTEND_URL') . '/payment/failed?id=' . $payment->id);

        } catch (\Exception $e) {
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

        if ($signature !== $expectedSignature) {
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
