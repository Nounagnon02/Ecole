<?php

namespace Tests\Unit\Services;

use App\Services\AIService;
use App\Support\CircuitBreaker;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['services.anthropic.api_key' => 'sk-ant-test']);
    }

    /** @test */
    public function a_transient_failure_is_absorbed_by_a_retry()
    {
        Http::fake([
            'api.anthropic.com/*' => Http::sequence()
                ->pushStatus(503)
                ->push(['content' => [['type' => 'text', 'text' => 'Bonjour']]], 200),
        ]);

        $result = (new AIService())->chat('system', [['role' => 'user', 'content' => 'Bonjour']]);

        $this->assertTrue($result['success']);
        Http::assertSentCount(2);
    }

    /** @test */
    public function repeated_server_errors_open_the_circuit_and_the_fallback_stops_calling_the_api()
    {
        Http::fake(['api.anthropic.com/*' => Http::response(null, 500)]);

        $service = new AIService();

        for ($i = 0; $i < 5; $i++) {
            $service->chat('system', [['role' => 'user', 'content' => "message {$i}"]]);
        }

        $this->assertTrue(CircuitBreaker::isOpen('anthropic'));

        $callsBefore = count(Http::recorded());
        $result = $service->chat('system', [['role' => 'user', 'content' => 'après ouverture']]);

        $this->assertFalse($result['success']);
        $this->assertSame($callsBefore, count(Http::recorded()));
    }

    /** @test */
    public function a_rate_limit_response_never_counts_against_the_circuit()
    {
        Http::fake(['api.anthropic.com/*' => Http::response(['error' => ['message' => 'rate limited']], 429)]);

        $service = new AIService();

        for ($i = 0; $i < 10; $i++) {
            $service->chat('system', [['role' => 'user', 'content' => "message {$i}"]]);
        }

        $this->assertFalse(CircuitBreaker::isOpen('anthropic'));
    }
}
