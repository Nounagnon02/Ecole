<?php

namespace Database\Factories\SaaS;

use App\Models\SaaS\Subscription;
use App\Models\SaaS\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = \App\Models\SaaS\Invoice::class;

    public function definition()
    {
        return [
            'tenant_id'       => Tenant::factory(),
            'subscription_id' => Subscription::factory(),
            'invoice_number'  => 'INV-' . fake()->unique()->numerify('########'),
            'status'          => 'pending',
            'amount'          => fake()->numberBetween(5000, 150000),
            'currency'        => 'XOF',
            'billing_cycle'   => 'monthly',
            'due_at'          => now()->addDays(30),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn() => [
            'status'         => 'paid',
            'paid_at'        => now(),
            'payment_method' => 'mobile_money',
        ]);
    }
}
