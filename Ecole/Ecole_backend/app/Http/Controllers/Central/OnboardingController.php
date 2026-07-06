<?php

namespace App\Http\Controllers\Central;

use App\Models\SaaS\Tenant;
use App\Models\SaaS\Plan;
use App\Models\SaaS\Module;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * OnboardingController — Inscription multi-tenant en plusieurs étapes.
 *
 * Steps:
 * 1. School info (name, slug, domain, school_type)
 * 2. Plan selection
 * 3. Admin account creation
 * 4. Module selection
 * 5. Payment (optional — free trial available)
 */
class OnboardingController extends Controller
{
    public function __construct(
        protected BillingService $billingService
    ) {}

    /**
     * Get initial onboarding data (plans, school types).
     */
    public function init()
    {
        return response()->json([
            'plans' => Plan::where('is_active', true)->get(),
            'school_types' => [
                ['value' => 'maternelle', 'label' => 'Maternelle'],
                ['value' => 'primaire', 'label' => 'Primaire'],
                ['value' => 'secondaire', 'label' => 'Secondaire'],
                ['value' => 'universite', 'label' => 'Université'],
                ['value' => 'complexe', 'label' => 'Complexe scolaire'],
            ],
            'modules' => Module::where('is_active', true)->get(),
        ]);
    }

    /**
     * Step 1: Create the tenant (school) with basic info.
     */
    public function stepSchool(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:tenants,slug|max:100',
            'domain' => 'required|string|unique:tenants,domain|max:100',
            'school_type' => 'required|string|in:maternelle,primaire,secondaire,universite,complexe',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
        ]);

        $tenant = Tenant::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'domain' => $validated['domain'],
            'school_type' => $validated['school_type'],
            'status' => 'trial',
        ]);

        // Save onboarding settings
        $tenant->setSetting('phone', $validated['phone'] ?? '');
        $tenant->setSetting('email', $validated['email'] ?? '');
        $tenant->setSetting('address', $validated['address'] ?? '');
        $tenant->setSetting('city', $validated['city'] ?? '');
        $tenant->setSetting('country', $validated['country'] ?? '');
        $tenant->setSetting('onboarding_step', 'school');

        return response()->json([
            'tenant' => $tenant,
            'step' => 'school',
            'next' => 'plan',
        ], 201);
    }

    /**
     * Step 2: Select a plan and optionally pay.
     */
    public function stepPlan(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $plan = Plan::findOrFail($validated['plan_id']);

        // Attach plan to tenant
        $tenant->update(['plan_id' => $plan->id]);
        $tenant->setSetting('onboarding_step', 'plan');

        // Create subscription with trial
        $result = $this->billingService->createSubscription(
            $tenant,
            $plan->id,
            $validated['billing_cycle']
        );

        return response()->json([
            'tenant' => $tenant->fresh()->load('plan'),
            'subscription' => $result['subscription'],
            'payment' => $result['payment'],
            'step' => 'plan',
            'next' => $result['payment']['success'] ? 'admin' : 'payment',
        ]);
    }

    /**
     * Step 3: Create the admin user for the tenant.
     * This runs INSIDE the tenant context.
     */
    public function stepAdmin(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);

        // Initialize tenant database
        if (!$tenant->getSetting('db_initialized')) {
            $tenant->run(function () {
                // Run migrations for this tenant
                $this->initializeTenantDatabase();
            });
        }

        // Create the admin user inside the tenant
        $user = null;
        $tenant->run(function () use ($validated, &$user) {
            $user = \App\Models\User::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? '',
                'role' => 'directeur',
            ]);

            // Assign super-admin role via Spatie
            $user->assignRole('super-admin');
        });

        $tenant->setSetting('admin_email', $validated['email']);
        $tenant->setSetting('onboarding_step', 'admin');

        return response()->json([
            'message' => 'Administrateur créé avec succès.',
            'email' => $validated['email'],
            'step' => 'admin',
            'next' => 'modules',
        ]);
    }

    /**
     * Step 4: Select modules to enable.
     */
    public function stepModules(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'module_ids' => 'required|array',
            'module_ids.*' => 'exists:modules,id',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);

        // Enable selected modules
        $tenant->modules()->sync($validated['module_ids']);

        // Enable core modules automatically
        $coreModules = Module::where('is_core', true)->pluck('id')->toArray();
        $tenant->modules()->syncWithoutDetaching($coreModules);

        $tenant->setSetting('onboarding_step', 'completed');
        $tenant->setSetting('onboarded_at', now()->toISOString());

        return response()->json([
            'message' => 'Modules activés. Inscription terminée !',
            'modules' => $tenant->modules()->get(),
            'tenant' => $tenant->fresh(),
            'next' => 'complete',
        ]);
    }

    /**
     * Get onboarding status for a tenant.
     */
    public function status(Tenant $tenant)
    {
        return response()->json([
            'tenant' => $tenant->load('plan', 'modules'),
            'onboarding_step' => $tenant->getSetting('onboarding_step', 'school'),
            'onboarded' => $tenant->getSetting('onboarded_at') !== null,
            'settings' => [
                'phone' => $tenant->getSetting('phone'),
                'email' => $tenant->getSetting('email'),
                'address' => $tenant->getSetting('address'),
                'city' => $tenant->getSetting('city'),
                'country' => $tenant->getSetting('country'),
            ],
        ]);
    }

    /**
     * Initialize tenant database with default data.
     */
    protected function initializeTenantDatabase(): void
    {
        // Run tenant migrations
        $migrator = app('migrator');
        $migrator->run(database_path('migrations/tenant'));

        // Run default seeders for tenant
        $seeder = app('db.seeder');
        $seeder->call('DatabaseSeeder');
    }

    /**
     * Check if a slug is available.
     */
    public function checkSlug(Request $request)
    {
        $slug = $request->input('slug');
        $exists = Tenant::where('slug', $slug)->exists();

        return response()->json([
            'slug' => $slug,
            'available' => !$exists,
        ]);
    }

    /**
     * Check if a domain is available.
     */
    public function checkDomain(Request $request)
    {
        $domain = $request->input('domain');
        $exists = Tenant::where('domain', $domain)->exists();

        return response()->json([
            'domain' => $domain,
            'available' => !$exists,
        ]);
    }
}
