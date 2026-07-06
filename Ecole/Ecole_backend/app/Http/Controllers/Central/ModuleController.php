<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Module;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ModuleController extends Controller
{
    public function index()
    {
        return response()->json(Module::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string|unique:modules,slug|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_core' => 'boolean',
            'is_active' => 'boolean',
            'required_roles' => 'nullable|array',
        ]);

        $module = Module::create($validated);

        return response()->json($module, 201);
    }

    public function show(Module $module)
    {
        return response()->json($module);
    }

    public function update(Request $request, Module $module)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_core' => 'boolean',
            'is_active' => 'boolean',
            'required_roles' => 'nullable|array',
        ]);

        $module->update($validated);

        return response()->json($module);
    }

    public function destroy(Module $module)
    {
        if ($module->tenants()->exists()) {
            return response()->json([
                'message' => 'Ce module est activé sur des établissements. Désactivez-le d\'abord.',
            ], 409);
        }

        $module->delete();

        return response()->json(['message' => 'Module supprimé']);
    }

    /**
     * Toggle module for a tenant.
     */
    public function toggleForTenant(Request $request, Module $module)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'enabled' => 'required|boolean',
        ]);

        if ($validated['enabled']) {
            $module->tenants()->syncWithoutDetaching([$validated['tenant_id']]);
        } else {
            $module->tenants()->detach($validated['tenant_id']);
        }

        return response()->json([
            'module' => $module->slug,
            'tenant_id' => $validated['tenant_id'],
            'enabled' => $validated['enabled'],
        ]);
    }
}
