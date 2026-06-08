<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    /**
     * Test that the API health endpoint returns a successful response.
     * This is the most basic smoke test — if this fails, the API is down.
     */
    public function test_health_endpoint_returns_success()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                 ]);
    }

    /**
     * Test that the health endpoint confirms the API is UP.
     */
    public function test_health_endpoint_shows_up()
    {
        $response = $this->getJson('/api/health');

        $response->assertJson([
            'status' => 'UP',
        ]);
    }
}
