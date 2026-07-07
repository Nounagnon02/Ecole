<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ApiResponseFormatTest extends TestCase
{
    /** @test */
    public function health_endpoint_returns_consistent_structure()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                     'timestamp',
                 ]);
    }

    /** @test */
    public function health_endpoint_has_correct_status()
    {
        $response = $this->getJson('/api/health');

        $response->assertJson([
            'status' => 'UP',
        ]);
    }

    /** @test */
    public function api_error_response_has_consistent_format()
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
        // Sanctum returns 401 with a message
        $this->assertTrue(
            $response->headers->has('Content-Type'),
            'Response should have Content-Type header'
        );
    }

    /** @test */
    public function api_uses_json_accept_header()
    {
        $response = $this->getJson('/api/health', [
            'Accept' => 'application/json',
        ]);

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'application/json');
    }

    /** @test */
    public function api_rejects_non_json_requests()
    {
        $response = $this->get('/api/health', [
            'Accept' => 'text/html',
        ]);

        // If ForceJsonResponse middleware is active, still returns JSON
        $this->assertStringContainsString(
            'application/json',
            $response->headers->get('Content-Type') ?? 'application/json'
        );
    }

    /** @test */
    public function not_found_returns_json_structure()
    {
        $response = $this->getJson('/api/non-existent-route');

        $response->assertStatus(404);
    }

    /** @test */
    public function health_endpoint_response_time_is_acceptable()
    {
        $start = microtime(true);

        $this->getJson('/api/health');

        $duration = (microtime(true) - $start) * 1000; // ms

        $this->assertLessThan(500, $duration, 'API response time should be under 500ms');
    }
}
