<?php

namespace App\Http\Controllers;

use App\Models\booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use FedaPay\FedaPay;
use FedaPay\Transaction;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Configuration FedaPay
        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.environment'));
    }

    /**
     * Créer une transaction de paiement (sans redirection)
     */
    public function createPayment(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:100',
            'currency' => 'required|in:XOF,EUR,USD',
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
        ]);

        try {
            $booking = booking::findOrFail($request->booking_id);

            if ($booking->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation a déjà été payée'
                ], 400);
            }

            // Créer la transaction FedaPay sans callback_url
            $transaction = Transaction::create([
                'description' => 'Réservation chambre #' . $booking->id,
                'amount' => $request->amount,
                'currency' => ['iso' => $request->currency],
                'customer' => [
                    'firstname' => $request->customer_name,
                    'lastname' => $request->customer_name,
                    'email' => $request->customer_email,
                    'phone_number' => [
                        'number' => $request->customer_phone,
                        'country' => 'bj'
                    ]
                ]
            ]);

            $booking->update([
                'transaction_id' => $transaction->id,
                'payment_status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction_id' => $transaction->id,
                    'booking_id' => $booking->id,
                    'amount' => $transaction->amount,
                    'currency' => isset($transaction->currency['iso']) ? $transaction->currency['iso'] : $request->currency
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payment creation error', [
                'message' => $e->getMessage(),
                'booking_id' => $request->booking_id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Traiter un paiement Mobile Money
     */
    public function processMobileMoney(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'phone_number' => 'required|string',
            'operator' => 'required|in:mtn,moov'
        ]);

        try {
            // Pour le mode sandbox, on simule le paiement
            if (config('services.fedapay.environment') === 'sandbox') {
                // Simuler un délai de traitement
                sleep(2);

                // Mettre à jour la réservation comme payée
                $booking = booking::where('transaction_id', $request->transaction_id)->first();
                if ($booking) {
                    $booking->update([
                        'payment_status' => 'paid',
                        'paid_at' => now()
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Paiement Mobile Money réussi (mode test)',
                    'data' => [
                        'transaction_id' => $request->transaction_id,
                        'status' => 'approved'
                    ]
                ]);
            }

            // Pour la production, utiliser FedaPay
            $transaction = Transaction::retrieve($request->transaction_id);

            // Initier le paiement Mobile Money
            $transaction->sendNow([
                'phone_number' => $request->phone_number,
                'operator' => $request->operator
            ]);

            $updatedTransaction = Transaction::retrieve($request->transaction_id);

            return response()->json([
                'success' => true,
                'message' => 'Paiement initié. Vérifiez votre téléphone.',
                'data' => [
                    'transaction_id' => $updatedTransaction->id,
                    'status' => $updatedTransaction->status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Mobile Money payment error', [
                'transaction_id' => $request->transaction_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du paiement Mobile Money',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Traiter un paiement par carte
     */
    public function processCard(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string',
            'card_number' => 'required|string',
            'expiry_month' => 'required|string',
            'expiry_year' => 'required|string',
            'cvv' => 'required|string',
            'cardholder_name' => 'required|string'
        ]);

        try {
            // Pour le mode sandbox, on simule le paiement
            if (config('services.fedapay.environment') === 'sandbox') {
                // Simuler un délai de traitement
                sleep(1);

                // Mettre à jour la réservation comme payée
                $booking = booking::where('transaction_id', $request->transaction_id)->first();
                if ($booking) {
                    $booking->update([
                        'payment_status' => 'paid',
                        'paid_at' => now()
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Paiement par carte réussi (mode test)',
                    'data' => [
                        'transaction_id' => $request->transaction_id,
                        'status' => 'approved'
                    ]
                ]);
            }

            // Pour la production, utiliser FedaPay
            $transaction = Transaction::retrieve($request->transaction_id);

            $transaction->sendNow([
                'card_number' => $request->card_number,
                'card_exp_month' => $request->expiry_month,
                'card_exp_year' => $request->expiry_year,
                'card_cvc' => $request->cvv,
                'card_name' => $request->cardholder_name
            ]);

            $updatedTransaction = Transaction::retrieve($request->transaction_id);

            return response()->json([
                'success' => true,
                'message' => 'Paiement traité avec succès',
                'data' => [
                    'transaction_id' => $updatedTransaction->id,
                    'status' => $updatedTransaction->status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Card payment error', [
                'transaction_id' => $request->transaction_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du paiement par carte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier le statut d'un paiement
     */
    public function checkPaymentStatus(Request $request)
    {
        $request->validate([
            'transaction_id' => 'required|string'
        ]);

        try {
            $transaction = Transaction::retrieve($request->transaction_id);
            $booking = booking::where('transaction_id', $request->transaction_id)->first();

            // Mettre à jour le statut de la réservation si approuvé
            if ($transaction->status === 'approved' && $booking && $booking->payment_status !== 'paid') {
                $booking->update([
                    'payment_status' => 'paid',
                    'paid_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $transaction->status,
                    'transaction_id' => $transaction->id,
                    'amount' => $transaction->amount,
                    'currency' => isset($transaction->currency['iso']) ? $transaction->currency['iso'] : 'XOF',
                    'booking_status' => $booking ? $booking->payment_status : null
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Callback après paiement (redirection utilisateur)
     */
    public function callback(Request $request)
    {
        $transactionId = $request->query('id');

        try {
            $transaction = Transaction::retrieve($transactionId);
            $booking = booking::where('transaction_id', $transactionId)->first();

            if (!$booking) {
                return redirect(env('FRONTEND_URL') . '/payment/error?message=Réservation non trouvée');
            }

            if ($transaction->status === 'approved') {
                $booking->update([
                    'payment_status' => 'paid',
                    'paid_at' => now()
                ]);

                return redirect(env('FRONTEND_URL') . '/payment/success?booking_id=' . $booking->id);
            } else {
                return redirect(env('FRONTEND_URL') . '/payment/failed?booking_id=' . $booking->id);
            }

        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/payment/error?message=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Webhook pour les notifications FedaPay
     */
    public function webhook(Request $request)
    {
        // Vérifier la signature du webhook
        $signature = $request->header('X-FedaPay-Signature');
        $payload = $request->getContent();

        $expectedSignature = hash_hmac('sha256', $payload, config('services.fedapay.webhook_secret'));

        if ($signature !== $expectedSignature) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        try {
            if ($data['entity']['transaction']) {
                $transactionId = $data['entity']['transaction']['id'];
                $status = $data['entity']['transaction']['status'];

                $booking = booking::where('transaction_id', $transactionId)->first();

                if ($booking) {
                    if ($status === 'approved') {
                        $booking->update([
                            'payment_status' => 'paid',
                            'paid_at' => now()
                        ]);

                        // Envoyer email de confirmation
                        // Mail::to($booking->customer_email)->send(new BookingConfirmed($booking));
                    } elseif ($status === 'declined') {
                        $booking->update([
                            'payment_status' => 'failed'
                        ]);
                    }
                }
            }

            return response()->json(['success' => true], 200);

        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }
}
