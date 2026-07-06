<?php

namespace App\Modules\Central\Controllers;

use App\Models\SaaS\Tenant as TenantModel;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(TenantModel::with('plan', 'subscription')->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:tenants,slug',
            'domain' => 'required|string|unique:tenants,domain',
            'plan_id' => 'required|exists:plans,id',
            'school_type' => 'required|string',
        ]);

        $tenant = new TenantModel($validated);
        $tenant->save();

        return response()->json($tenant, 201);
    }

    public function show(TenantModel $tenant)
    {
        return response()->json($tenant->load('plan', 'subscription', 'modules'));
    }

    public function update(Request $request, TenantModel $tenant)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'domain' => 'string|unique:tenants,domain,' . $tenant->id,
            'plan_id' => 'exists:plans,id',
            'status' => 'in:active,trial,suspended,expired',
        ]);

        $tenant->update($validated);

        return response()->json($tenant);
    }

    public function destroy(TenantModel $tenant)
    {
        $tenant->delete();

        return response()->json(['message' => 'Tenant supprimé']);
    }

    public function suspend(TenantModel $tenant)
    {
        $tenant->update(['status' => 'suspended']);

        return response()->json(['message' => 'Tenant suspendu']);
    }

    public function activate(TenantModel $tenant)
    {
        $tenant->update(['status' => 'active']);

        return response()->json(['message' => 'Tenant activé']);
    }
}
