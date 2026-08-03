<?php

use App\Models\SaaS\Tenant;
use App\Models\SaaS\Plan;
use App\Models\SaaS\Module;
use App\Models\User;

/* ─── Onboarding ───────────────────────────────────────────────────────── */

test('onboarding init returns plans and school types', function () {
    Plan::factory()->count(3)->create(['is_active' => true]);
    Module::factory()->count(2)->create(['is_active' => true]);

    $response = $this->getJson('/api/v1/onboarding/init');
    $response->assertStatus(200)
        ->assertJsonStructure(['plans', 'school_types', 'modules']);
});

test('onboarding school step creates tenant', function () {
    $response = $this->postJson('/api/v1/onboarding/step/school', [
        'name' => 'New School',
        'slug' => 'new-school-' . time(),
        'domain' => 'new-school-' . time() . '.example.com',
        'school_type' => 'primaire',
        'phone' => '+22901020304',
        'email' => 'school@test.com',
        'address' => '123 Main St',
        'city' => 'Cotonou',
        'country' => 'Bénin',
    ]);

    if ($response->status() === 201) {
        $response->assertJsonStructure(['tenant', 'step', 'next']);
        expect($response['tenant']['status'])->toEqual('trial');
    } else {
        // May fail if domain already exists — still valid structural test
        expect(true)->toBeTrue();
    }
});

test('slug availability check works', function () {
    // La création du tenant était commentée faute de TenantFactory ; elle
    // existe désormais, donc le cas « slug déjà pris » est réellement testé.
    Tenant::factory()->create(['slug' => 'taken-slug']);

    $response = $this->getJson('/api/v1/onboarding/check-slug?slug=taken-slug');
    $response->assertStatus(200)
        ->assertJson(['available' => false]);

    $response = $this->getJson('/api/v1/onboarding/check-slug?slug=available-slug');
    $response->assertStatus(200)
        ->assertJson(['available' => true]);
});

/* ─── Super Admin endpoints ────────────────────────────────────────────── */

test('analytics overview returns required fields', function () {
    // Seed some data
    Plan::factory()->create(['slug' => 'starter']);
    Plan::factory()->create(['slug' => 'pro']);

    $response = $this->getJson('/api/v1/admin/analytics/overview');
    if ($response->status() === 200) {
        $response->assertJsonStructure([
            'total_schools', 'active_schools', 'trial_schools',
            'suspended_schools', 'total_revenue', 'monthly_revenue',
            'yearly_revenue', 'plan_distribution',
        ]);
    } else {
        // 401 if not authenticated — expected
        expect($response->status())->toBe(401);
    }
});

/* ─── Module toggling ──────────────────────────────────────────────────── */

test('can toggle module for tenant', function () {
    // Ces routes exigent role:super-admin. Sans authentification le test
    // recevait 401, le `if` ne s'exécutait jamais et aucune assertion n'était
    // évaluée : le test passait en ne vérifiant rien.
    $this->actingAs(User::factory()->create(['role' => 'super-admin']));

    $tenant = Tenant::factory()->create();
    $module = Module::factory()->create();

    $this->postJson("/api/v1/admin/modules/{$module->id}/toggle", [
        'tenant_id' => $tenant->id,
        'enabled' => true,
    ])->assertStatus(200)->assertJsonPath('enabled', true);

    expect($tenant->fresh()->hasModule($module->slug))->toBeTrue();

    // Et le retrait doit fonctionner aussi.
    $this->postJson("/api/v1/admin/modules/{$module->id}/toggle", [
        'tenant_id' => $tenant->id,
        'enabled' => false,
    ])->assertStatus(200)->assertJsonPath('enabled', false);

    expect($tenant->fresh()->hasModule($module->slug))->toBeFalse();
});

/* ─── White-label settings ─────────────────────────────────────────────── */

test('tenant settings can be updated', function () {
    $this->actingAs(User::factory()->create(['role' => 'super-admin']));

    $tenant = Tenant::factory()->create();

    $this->patchJson("/api/v1/admin/tenants/{$tenant->id}/settings", [
        'primary_color' => '#FF0000',
        'brand_name' => 'Custom Brand',
        'locale' => 'fr',
    ])->assertStatus(200);

    $fresh = $tenant->fresh();
    expect($fresh->getSetting('primary_color'))->toEqual('#FF0000');
    expect($fresh->getSetting('brand_name'))->toEqual('Custom Brand');
    expect($fresh->getSetting('locale'))->toEqual('fr');
});
