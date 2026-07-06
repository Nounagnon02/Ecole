<?php

use App\Models\SaaS\Plan;
use App\Models\SaaS\Tenant;
use App\Models\SaaS\Subscription;
use App\Models\SaaS\Module;

/* ─── Plan Model ───────────────────────────────────────────────────────── */

test('plan can be created with valid data', function () {
    $plan = Plan::create([
        'name' => 'Test Plan',
        'slug' => 'test-plan',
        'description' => 'A test plan',
        'price_monthly' => 1000,
        'price_yearly' => 10000,
        'max_students' => 100,
        'max_schools' => 1,
        'features' => ['feature_a', 'feature_b'],
        'modules' => ['core', 'academique'],
        'is_popular' => false,
        'is_active' => true,
    ]);

    expect($plan)->toBeInstanceOf(Plan::class)
        ->and($plan->name)->toEqual('Test Plan')
        ->and($plan->features)->toHaveCount(2)
        ->and($plan->modules)->toHaveCount(2)
        ->and($plan->is_popular)->toBeFalse()
        ->and($plan->is_active)->toBeTrue();
});

test('plan has subscriptions relationship', function () {
    $plan = Plan::factory()->create();
    expect($plan->subscriptions())->toBeInstanceOf(
        Illuminate\Database\Eloquent\Relations\HasMany::class
    );
});

test('plan has tenants relationship', function () {
    $plan = Plan::factory()->create();
    expect($plan->tenants())->toBeInstanceOf(
        Illuminate\Database\Eloquent\Relations\HasMany::class
    );
});

test('plan price is stored as decimal', function () {
    $plan = Plan::factory()->create(['price_monthly' => 29.99]);
    expect((float) $plan->price_monthly)->toBe(29.99);
});

/* ─── Tenant Model ─────────────────────────────────────────────────────── */

test('tenant can be created with fillable attributes', function () {
    $tenant = Tenant::create([
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'data' => [],
        'name' => 'Test School',
        'slug' => 'test-school',
        'domain' => 'test-school.example.com',
        'plan_id' => null,
        'status' => 'trial',
        'school_type' => 'primaire',
    ]);

    expect($tenant)->toBeInstanceOf(Tenant::class)
        ->and($tenant->name)->toEqual('Test School')
        ->and($tenant->status)->toEqual('trial')
        ->and($tenant->school_type)->toEqual('primaire');
});

test('tenant belongs to a plan', function () {
    $plan = Plan::factory()->create();
    $tenant = Tenant::factory()->create(['plan_id' => $plan->id]);

    expect($tenant->plan)->toBeInstanceOf(Plan::class)
        ->and($tenant->plan->id)->toEqual($plan->id);
});

test('tenant has settings relationship', function () {
    $tenant = Tenant::factory()->create();
    expect($tenant->settings())->toBeInstanceOf(
        Illuminate\Database\Eloquent\Relations\HasMany::class
    );
});

test('tenant can have modules', function () {
    $tenant = Tenant::factory()->create();
    $module = Module::factory()->create();

    $tenant->modules()->attach($module);

    expect($tenant->modules)->toHaveCount(1)
        ->and($tenant->hasModule($module->slug))->toBeTrue();
});

test('tenant can get and set settings', function () {
    $tenant = Tenant::factory()->create();

    $tenant->setSetting('theme_color', '#4F46E5');
    expect($tenant->getSetting('theme_color'))->toEqual('#4F46E5');
    expect($tenant->getSetting('nonexistent', 'default'))->toEqual('default');
});

/* ─── Subscription Model ───────────────────────────────────────────────── */

test('subscription has active check', function () {
    $active = Subscription::factory()->create(['status' => 'active']);
    $trial = Subscription::factory()->create(['status' => 'trial']);
    $expired = Subscription::factory()->create(['status' => 'expired']);

    expect($active->isActive())->toBeTrue()
        ->and($trial->isActive())->toBeTrue()
        ->and($expired->isActive())->toBeFalse();
});

test('subscription expiry detection', function () {
    $past = Subscription::factory()->create([
        'ends_at' => now()->subDay(),
        'status' => 'expired',
    ]);

    expect($past->isExpired())->toBeTrue();

    $future = Subscription::factory()->create([
        'ends_at' => now()->addMonth(),
        'status' => 'active',
    ]);

    expect($future->isExpired())->toBeFalse();
});

/* ─── Module Model ─────────────────────────────────────────────────────── */

test('module can be created with roles array cast', function () {
    $module = Module::factory()->create([
        'required_roles' => ['directeur', 'enseignant'],
    ]);

    expect($module->required_roles)->toBeArray()
        ->toContain('directeur')
        ->toContain('enseignant');
});
