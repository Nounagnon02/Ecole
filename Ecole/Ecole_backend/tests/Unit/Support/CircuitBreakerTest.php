<?php

namespace Tests\Unit\Support;

use App\Support\CircuitBreaker;
use Tests\TestCase;

class CircuitBreakerTest extends TestCase
{
    /** @test */
    public function it_is_closed_by_default()
    {
        $this->assertFalse(CircuitBreaker::isOpen('test-service'));
    }

    /** @test */
    public function it_opens_once_the_failure_threshold_is_reached()
    {
        CircuitBreaker::recordFailure('test-service', threshold: 3, cooldownSeconds: 60);
        $this->assertFalse(CircuitBreaker::isOpen('test-service'));

        CircuitBreaker::recordFailure('test-service', threshold: 3, cooldownSeconds: 60);
        $this->assertFalse(CircuitBreaker::isOpen('test-service'));

        CircuitBreaker::recordFailure('test-service', threshold: 3, cooldownSeconds: 60);
        $this->assertTrue(CircuitBreaker::isOpen('test-service'));
    }

    /** @test */
    public function a_success_resets_the_failure_count_and_closes_the_circuit()
    {
        CircuitBreaker::recordFailure('test-service', threshold: 2, cooldownSeconds: 60);
        CircuitBreaker::recordFailure('test-service', threshold: 2, cooldownSeconds: 60);
        $this->assertTrue(CircuitBreaker::isOpen('test-service'));

        CircuitBreaker::recordSuccess('test-service');

        $this->assertFalse(CircuitBreaker::isOpen('test-service'));

        // Le compteur d'échecs est bien reparti à zéro, pas seulement le
        // drapeau "ouvert" : un seul nouvel échec ne doit pas rouvrir le
        // circuit immédiatement.
        CircuitBreaker::recordFailure('test-service', threshold: 2, cooldownSeconds: 60);
        $this->assertFalse(CircuitBreaker::isOpen('test-service'));
    }

    /** @test */
    public function the_default_threshold_is_five_consecutive_failures()
    {
        for ($i = 0; $i < 4; $i++) {
            CircuitBreaker::recordFailure('test-service');
        }
        $this->assertFalse(CircuitBreaker::isOpen('test-service'), 'Ne doit pas encore ouvrir après seulement 4 échecs.');

        CircuitBreaker::recordFailure('test-service');
        $this->assertTrue(CircuitBreaker::isOpen('test-service'), 'Doit ouvrir au 5e échec consécutif par défaut.');
    }

    /** @test */
    public function each_service_has_an_independent_circuit()
    {
        CircuitBreaker::recordFailure('fedapay', threshold: 1, cooldownSeconds: 60);

        $this->assertTrue(CircuitBreaker::isOpen('fedapay'));
        $this->assertFalse(CircuitBreaker::isOpen('anthropic'));
    }
}
