<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Plan;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json(Plan::where('is_active', true)->get());
    }

    public function all()
    {
        return response()->json(Plan::withCount('tenants')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:plans,slug',
            'description' => 'nullable|string',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'max_students' => 'required|integer|min:0',
            'max_schools' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'modules' => 'nullable|array',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $plan = Plan::create($validated);

        return response()->json($plan, 201);
    }

    public function show(Plan $plan)
    {
        return response()->json($plan->loadCount('tenants'));
    }

    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price_monthly' => 'sometimes|numeric|min:0',
            'price_yearly' => 'sometimes|numeric|min:0',
            'max_students' => 'sometimes|integer|min:0',
            'max_schools' => 'sometimes|integer|min:1',
            'features' => 'nullable|array',
            'modules' => 'nullable|array',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return response()->json($plan);
    }

    public function destroy(Plan $plan)
    {
        if ($plan->tenants()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce plan : des établissements y sont abonnés.',
            ], 409);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan supprimé']);
    }
}
