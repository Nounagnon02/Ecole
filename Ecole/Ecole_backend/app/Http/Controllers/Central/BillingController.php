<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Tenant;
use App\Models\SaaS\Subscription;
use App\Models\SaaS\Invoice;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BillingController extends Controller
{
    public function __construct(
        protected BillingService $billingService
    ) {}

    /**
     * Subscribe a tenant to a plan.
     */
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);

        $result = $this->billingService->createSubscription(
            $tenant,
            $validated['plan_id'],
            $validated['billing_cycle']
        );

        if ($result['payment']['success']) {
            return response()->json([
                'message' => 'Abonnement créé. Redirection vers le paiement.',
                'subscription' => $result['subscription'],
                'invoice' => $result['invoice'],
                'payment_url' => $result['payment']['payment_url'],
            ], 201);
        }

        return response()->json([
            'message' => 'Abonnement créé mais échec du paiement.',
            'subscription' => $result['subscription'],
            'invoice' => $result['invoice'],
            'error' => $result['payment']['error'],
        ], 402);
    }

    /**
     * Verify a payment for an invoice.
     */
    public function verify(Invoice $invoice)
    {
        $result = $this->billingService->verifyPayment($invoice);

        return response()->json($result);
    }

    /**
     * Cancel a subscription.
     */
    public function cancel(Subscription $subscription)
    {
        $sub = $this->billingService->cancelSubscription($subscription);

        return response()->json([
            'message' => 'Abonnement annulé.',
            'subscription' => $sub,
        ]);
    }

    /**
     * List invoices for a tenant.
     */
    public function invoices(Request $request)
    {
        $query = Invoice::with('subscription.plan');

        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }

        return response()->json(
            $query->orderBy('created_at', 'desc')->paginate(15)
        );
    }

    /**
     * Show specific invoice.
     */
    public function showInvoice(Invoice $invoice)
    {
        return response()->json(
            $invoice->load('subscription.plan', 'tenant')
        );
    }

    /**
     * Payment callback (after provider redirect).
     */
    public function callback(Request $request)
    {
        $invoice = Invoice::where('payment_provider_id', $request->transaction_id)
            ->orWhere('id', $request->invoice_id)
            ->first();

        if (!$invoice) {
            return response()->json(['message' => 'Facture introuvable.'], 404);
        }

        $result = $this->billingService->verifyPayment($invoice);

        return response()->json([
            'message' => $result['success'] ? 'Paiement confirmé.' : 'Paiement non confirmé.',
            'status' => $result['status'],
            'invoice' => $result['invoice'],
        ]);
    }

    /**
     * Payment cancellation.
     */
    public function cancelPayment(Request $request)
    {
        return response()->json([
            'message' => 'Paiement annulé.',
            'status' => 'canceled',
        ]);
    }
}
