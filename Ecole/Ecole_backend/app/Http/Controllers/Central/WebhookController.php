<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Invoice;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

/**
 * WebhookController — Reçoit les notifications des fournisseurs de paiement.
 *
 * Tous les webhooks sont protégés par vérification de signature et rate limiting.
 */
class WebhookController extends Controller
{
    public function __construct(
        protected BillingService $billingService
    ) {}

    /**
     * Vérifie la signature CinetPay.
     */
    protected function verifyCinetpaySignature(Request $request): bool
    {
        // CinetPay utilise un HMAC SHA256 avec la clé API
        $signature = $request->header('X-Signature');
        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, config('billing.cinetpay.api_key') ?? '');

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Vérifie la signature FedaPay.
     */
    protected function verifyFedapaySignature(Request $request): bool
    {
        // FedaPay utilise un HMAC SHA256 avec le webhook secret
        $signature = $request->header('X-FedaPay-Signature');
        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, config('billing.fedapay.webhook_secret') ?? '');

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Vérifie la signature Stripe.
     */
    protected function verifyStripeSignature(Request $request): bool
    {
        // En production, utiliser \Stripe\Webhook::constructEvent()
        // Pour le moment, on vérifie avec le secret du webhook
        $signature = $request->header('Stripe-Signature');
        if (!$signature) {
            return false;
        }

        $payload = $request->getContent();
        $expectedSignature = hash_hmac('sha256', $payload, config('billing.stripe.webhook_secret') ?? '');

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * CinetPay webhook handler.
     */
    public function cinetpay(Request $request)
    {
        // Vérification de signature (désactivée en environnement local/test)
        if (app()->environment('production') && !$this->verifyCinetpaySignature($request)) {
            Log::warning('[Webhook] Invalid CinetPay signature');
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        Log::info('[Webhook] CinetPay notification', $request->all());

        $transactionId = $request->input('transaction_id');

        if (!$transactionId) {
            return response()->json(['message' => 'Missing transaction_id'], 400);
        }

        $invoice = Invoice::where('payment_provider_id', $transactionId)->first();

        if (!$invoice) {
            Log::warning('[Webhook] Invoice not found for CinetPay transaction', [
                'transaction_id' => $transactionId,
            ]);
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $this->billingService->verifyPayment($invoice);

        return response()->json(['message' => 'OK']);
    }

    /**
     * FedaPay webhook handler.
     */
    public function fedapay(Request $request)
    {
        // Vérification de signature (désactivée en environnement local/test)
        if (app()->environment('production') && !$this->verifyFedapaySignature($request)) {
            Log::warning('[Webhook] Invalid FedaPay signature');
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        Log::info('[Webhook] FedaPay notification', $request->all());

        $transactionId = $request->input('transaction_id') ?? $request->input('id');

        if (!$transactionId) {
            return response()->json(['message' => 'Missing transaction_id'], 400);
        }

        $invoice = Invoice::where('payment_provider_id', $transactionId)->first();

        if (!$invoice) {
            Log::warning('[Webhook] Invoice not found for FedaPay transaction', [
                'transaction_id' => $transactionId,
            ]);
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $this->billingService->verifyPayment($invoice);

        return response()->json(['message' => 'OK']);
    }

    /**
     * Stripe webhook handler.
     */
    public function stripe(Request $request)
    {
        // Vérification de signature (désactivée en environnement local/test)
        if (app()->environment('production') && !$this->verifyStripeSignature($request)) {
            Log::warning('[Webhook] Invalid Stripe signature');
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        Log::info('[Webhook] Stripe notification', $request->all());

        $event = $request->input('type');
        $session = $request->input('data.object', []);

        if ($event === 'checkout.session.completed') {
            $sessionId = $session['id'] ?? null;

            if (!$sessionId) {
                return response()->json(['message' => 'Missing session ID'], 400);
            }

            $invoice = Invoice::where('payment_provider_id', $sessionId)->first();

            if (!$invoice) {
                Log::warning('[Webhook] Invoice not found for Stripe session', [
                    'session_id' => $sessionId,
                ]);
                return response()->json(['message' => 'Invoice not found'], 404);
            }

            $this->billingService->verifyPayment($invoice);
        }

        return response()->json(['message' => 'OK']);
    }
}
