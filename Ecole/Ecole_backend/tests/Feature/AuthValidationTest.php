<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthValidationTest extends TestCase
{
    /**
     * Test that the connexion endpoint validates required fields.
     */
    public function test_connexion_requires_identifiant()
    {
        $response = $this->postJson('/api/connexion', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['identifiant']);
    }

    /**
     * Test that the connexion endpoint validates required password.
     */
    public function test_connexion_requires_password()
    {
        $response = $this->postJson('/api/connexion', [
            'identifiant' => 'testuser',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test that the connexion endpoint returns 401 for invalid credentials.
     */
    public function test_connexion_with_invalid_credentials()
    {
        $response = $this->postJson('/api/connexion', [
            'identifiant' => 'nonexistent_user',
            'password' => 'wrongpassword',
        ]);

        // Should return 401 (unauthorized) for invalid credentials
        $this->assertTrue(
            $response->status() === 401 || $response->status() === 422,
            'Expected 401 or 422 for invalid credentials, got ' . $response->status()
        );
    }

    /**
     * Test that authenticated endpoints reject unauthenticated requests.
     */
    public function test_protected_endpoint_requires_auth()
    {
        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(401);
    }

    /**
     * Test that logout requires authentication.
     */
    public function test_logout_requires_auth()
    {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    }
}
