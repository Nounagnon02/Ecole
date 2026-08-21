<?php

use App\Models\User;
use App\Models\SaaS\Tenant;

/* ─── Authentication ───────────────────────────────────────────────────── */

// Le login du domaine central est /api/auth/login. La variante /api/v1/auth/login
// n'existe que sur les sous-domaines tenant (routes/tenant.php), où
// PreventAccessFromCentralDomains la rend volontairement inaccessible ici.

test('login requires email and password', function () {
    $response = $this->postJson('/api/auth/login', []);
    $response->assertStatus(422);
});

test('login fails with invalid credentials', function () {
    $response = $this->postJson('/api/auth/login', [
        'email' => 'nonexistent@test.com',
        'password' => 'wrong-password',
    ]);

    expect($response->status())->toBe(401);
});

test('tenant login is not reachable from the central domain', function () {
    $response = $this->postJson('/api/v1/auth/login', []);
    $response->assertStatus(404);
});

test('authenticated user can read their own profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')->getJson('/api/auth/me');

    $response->assertStatus(200)
        ->assertJsonPath('user.id', $user->id);
});

/* ─── Health endpoint ──────────────────────────────────────────────────── */

test('health endpoint returns ok', function () {
    $response = $this->getJson('/api/health');
    $response->assertStatus(200)
        ->assertJsonStructure(['status', 'timestamp']);
});

/* ─── API Structure ────────────────────────────────────────────────────── */

test('api response format is consistent', function () {
    $response = $this->getJson('/api/health');
    $response->assertJsonStructure([
        'status',
        'timestamp',
    ]);
});
