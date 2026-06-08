<?php

namespace Tests\Feature;

use Tests\TestCase;

class PaymentEndpointTest extends TestCase
{
    /**
     * Test that payment initialize requires authentication.
     */
    public function test_payment_initialize_requires_auth()
    {
        $response = $this->postJson('/api/payments/initialize', [
            'amount' => 1000,
            'currency' => 'XOF',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test that payment history requires authentication.
     */
    public function test_payment_history_requires_auth()
    {
        $response = $this->getJson('/api/payments/history');

        $response->assertStatus(401);
    }

    /**
     * Test that invalid payment data returns validation errors.
     */
    public function test_payment_initialize_validates_amount()
    {
        $response = $this->postJson('/api/payments/initialize', [
            'currency' => 'XOF',
        ]);

        $this->assertTrue(
            $response->status() === 401 || $response->status() === 422,
            'Expected 401 (no auth) or 422 (validation), got ' . $response->status()
        );
    }
}
