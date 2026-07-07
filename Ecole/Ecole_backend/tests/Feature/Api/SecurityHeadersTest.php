<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    /** @test */
    public function api_response_has_x_content_type_options_header()
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Content-Type-Options');
    }

    /** @test */
    public function api_response_has_x_frame_options_header()
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('X-Frame-Options');
    }

    /** @test */
    public function api_response_has_cache_control_header()
    {
        $response = $this->getJson('/api/health');

        $response->assertHeader('Cache-Control');
    }

    /** @test */
    public function api_response_has_cors_headers()
    {
        $response = $this->getJson('/api/health', [
            'Origin' => 'http://localhost:3000',
        ]);

        $response->assertHeader('Access-Control-Allow-Origin');
    }

    /** @test */
    public function api_uses_json_content_type()
    {
        $response = $this->getJson('/api/health');

        $this->assertStringContainsString(
            'application/json',
            $response->headers->get('Content-Type') ?? ''
        );
    }
}
