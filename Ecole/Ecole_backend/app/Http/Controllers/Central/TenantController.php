<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Tenant;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(
            Tenant::with('plan', 'subscription')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:tenants,slug',
            'domain' => 'required|string|unique:tenants,domain',
            'plan_id' => 'required|exists:plans,id',
            'school_type' => 'required|string|in:maternelle,primaire,secondaire,universite,complexe',
        ]);

        $tenant = Tenant::create($validated);

        return response()->json($tenant->load('plan'), 201);
    }

    public function show(Tenant $tenant)
    {
        return response()->json(
            $tenant->load('plan', 'subscription', 'modules', 'settings')
        );
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => 'sometimes|string|unique:tenants,domain,' . $tenant->id,
            'plan_id' => 'sometimes|exists:plans,id',
            'status' => 'sometimes|in:active,trial,suspended,expired',
            'school_type' => 'sometimes|string|in:maternelle,primaire,secondaire,universite,complexe',
        ]);

        $tenant->update($validated);

        return response()->json($tenant->fresh()->load('plan'));
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return response()->json(['message' => 'Établissement supprimé']);
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => 'suspended']);

        return response()->json(['message' => 'Établissement suspendu']);
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update(['status' => 'active']);

        return response()->json(['message' => 'Établissement activé']);
    }
}
