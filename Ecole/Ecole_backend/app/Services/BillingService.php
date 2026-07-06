<?php

namespace App\Services;

use App\Models\SaaS\Subscription;
use App\Models\SaaS\Invoice;
use App\Models\SaaS\Tenant;
use App\Services\Billing\PaymentProvider;
use Illuminate\Support\Str;

/**
 * BillingService — Gestion des abonnements et paiements SaaS.
 *
 * Coordonne le cycle de vie : souscription → facturation →
 * encaissement → vérification → relance.
 */
class BillingService
{
    protected PaymentProvider $provider;

    public function __construct(?string $provider = null)
    {
        $this->provider = PaymentProvider::factory($provider);
    }

    /**
     * Create a subscription for a tenant and generate an invoice.
     *
     * @param Tenant $tenant
     * @param int $planId
     * @param string $billingCycle 'monthly'|'yearly'
     * @return array
     */
    public function createSubscription(Tenant $tenant, int $planId, string $billingCycle = 'monthly'): array
    {
        $plan = $tenant->plan()->associate($planId)->plan;

        $amount = $billingCycle === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        // Create subscription record
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan_id' => $planId,
            'status' => 'trial',
            'billing_cycle' => $billingCycle,
            'amount' => $amount,
            'starts_at' => now(),
            'trial_ends_at' => now()->addDays(14),
        ]);

        // Generate invoice
        $invoice = $this->createInvoice($subscription, $amount);

        // Initialize payment
        $reference = 'ECOLE-' . strtoupper(Str::random(12));
        $result = $this->provider->initializePayment([
            'amount' => $amount,
            'currency' => 'XOF',
            'description' => "Abonnement {$plan->name} - {$tenant->name}",
            'reference' => $reference,
            'callback_url' => route('billing.callback'),
            'cancel_url' => route('billing.cancel'),
            'metadata' => [
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'invoice_id' => $invoice->id,
            ],
        ]);

        // Update invoice with provider info
        if ($result['success']) {
            $invoice->update([
                'payment_provider' => $this->provider->getName(),
                'payment_provider_id' => $result['transaction_id'],
            ]);

            $subscription->update([
                'payment_provider' => $this->provider->getName(),
                'payment_provider_id' => $result['transaction_id'],
            ]);
        }

        return [
            'subscription' => $subscription->fresh()->load('plan'),
            'invoice' => $invoice->fresh(),
            'payment' => $result,
        ];
    }

    /**
     * Verify a pending payment and update subscription/invoice status.
     *
     * @param Invoice $invoice
     * @return array
     */
    public function verifyPayment(Invoice $invoice): array
    {
        if (!$invoice->payment_provider_id) {
            return ['success' => false, 'message' => 'Aucune transaction associée.'];
        }

        // Use the provider that was used for this invoice
        $provider = PaymentProvider::factory($invoice->payment_provider);
        $result = $provider->verifyPayment($invoice->payment_provider_id);

        if ($result['success'] && $result['status'] === 'completed') {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $result['payment_method'],
            ]);

            // Activate the subscription
            $invoice->subscription?->update([
                'status' => 'active',
            ]);

            // Activate the tenant
            Tenant::where('id', $invoice->tenant_id)->update(['status' => 'active']);
        } elseif ($result['status'] === 'failed') {
            $invoice->update(['status' => 'failed']);
        }

        return [
            'success' => $result['success'],
            'status' => $result['status'],
            'invoice' => $invoice->fresh(),
        ];
    }

    /**
     * Cancel a subscription.
     *
     * @param Subscription $subscription
     * @return Subscription
     */
    public function cancelSubscription(Subscription $subscription): Subscription
    {
        $subscription->update([
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);

        return $subscription->fresh();
    }

    /**
     * Generate invoice number.
     */
    protected function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ymd');
        $last = Invoice::where('invoice_number', 'like', "{$prefix}-%")
            ->orderBy('id', 'desc')
            ->first();

        $next = $last ? (int) substr($last->invoice_number, -4) + 1 : 1;

        return "{$prefix}-" . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create an invoice for a subscription.
     *
     * @param Subscription $subscription
     * @param float $amount
     * @return Invoice
     */
    protected function createInvoice(Subscription $subscription, float $amount): Invoice
    {
        return Invoice::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $this->generateInvoiceNumber(),
            'status' => 'pending',
            'amount' => $amount,
            'currency' => 'XOF',
            'billing_cycle' => $subscription->billing_cycle,
            'due_at' => now()->addDays(7),
        ]);
    }
}
