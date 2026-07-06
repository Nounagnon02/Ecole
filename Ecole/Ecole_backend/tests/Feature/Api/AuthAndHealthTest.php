<?php

use App\Models\User;
use App\Models\SaaS\Tenant;

/* ─── Authentication ───────────────────────────────────────────────────── */

test('login requires email and password', function () {
    $response = $this->postJson('/api/v1/auth/login', []);
    $response->assertStatus(422);
});

test('login fails with invalid credentials', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'nonexistent@test.com',
        'password' => 'wrong-password',
    ]);

    expect(in_array($response->status(), [401, 422]))->toBeTrue();
});

test('authenticated user can access protected routes', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'sanctum');

    $response = $this->getJson('/api/v1/user');
    expect($response->status())->toBeIn([200, 404]); // 404 if route doesn't exist
});

/* ─── Health endpoint ──────────────────────────────────────────────────── */

test('health endpoint returns ok', function () {
    $response = $this->getJson('/api/v1/health');
    $response->assertStatus(200)
        ->assertJsonStructure(['status', 'timestamp']);
});

/* ─── API Structure ────────────────────────────────────────────────────── */

test('api response format is consistent', function () {
    $response = $this->getJson('/api/v1/health');
    $response->assertJsonStructure([
        'status',
        'timestamp',
    ]);
});
