<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthValidationTest extends TestCase
{
    /**
     * Test that the login endpoint validates required fields.
     */
    public function test_login_requires_identifiant()
    {
        $response = $this->postJson('/api/auth/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['identifiant']);
    }

    /**
     * Test that the login endpoint validates required password.
     */
    public function test_login_requires_password()
    {
        $response = $this->postJson('/api/auth/login', [
            'identifiant' => 'testuser',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test that the login endpoint returns 401 for invalid credentials.
     */
    public function test_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/auth/login', [
            'identifiant' => 'nonexistent_user',
            'password' => 'wrongpassword',
        ]);

        $this->assertTrue(
            $response->status() === 401,
            'Expected 401 for invalid credentials, got ' . $response->status()
        );
    }

    /**
     * Test that authenticated endpoints reject unauthenticated requests.
     */
    public function test_protected_endpoint_requires_auth()
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Test that logout requires authentication.
     */
    public function test_logout_requires_auth()
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    /**
     * Test that the API health endpoint is accessible without auth.
     */
    public function test_health_endpoint_public()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
    }
}
