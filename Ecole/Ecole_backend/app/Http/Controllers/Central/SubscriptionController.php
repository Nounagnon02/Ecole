<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Subscription;
use App\Models\SaaS\Tenant;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SubscriptionController extends Controller
{
    public function index()
    {
        return response()->json(
            Subscription::with('tenant', 'plan')
                ->orderBy('created_at', 'desc')
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
            'amount' => 'required|numeric|min:0',
            'trial_ends_at' => 'nullable|date',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
        ]);

        $validated['status'] = 'trial';
        $validated['starts_at'] ??= now();

        $subscription = Subscription::create($validated);

        // Update tenant's plan
        Tenant::where('id', $validated['tenant_id'])->update([
            'plan_id' => $validated['plan_id'],
            'status' => 'active',
        ]);

        return response()->json(
            $subscription->fresh()->load('tenant', 'plan'),
            201
        );
    }

    public function show(Subscription $subscription)
    {
        return response()->json($subscription->load('tenant', 'plan'));
    }

    public function update(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'plan_id' => 'sometimes|exists:plans,id',
            'status' => 'sometimes|in:active,trial,canceled,expired',
            'billing_cycle' => 'sometimes|in:monthly,yearly',
            'amount' => 'sometimes|numeric|min:0',
            'trial_ends_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'canceled_at' => 'nullable|date',
        ]);

        $subscription->update($validated);

        return response()->json($subscription->fresh()->load('tenant', 'plan'));
    }

    public function destroy(Subscription $subscription)
    {
        $subscription->update(['status' => 'canceled', 'canceled_at' => now()]);

        return response()->json(['message' => 'Abonnement annulé']);
    }
}
