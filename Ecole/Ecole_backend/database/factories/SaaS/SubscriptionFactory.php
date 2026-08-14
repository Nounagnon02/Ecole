<?php

namespace Database\Factories\SaaS;

use App\Models\SaaS\Plan;
use App\Models\SaaS\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubscriptionFactory extends Factory
{
    protected $model = \App\Models\SaaS\Subscription::class;

    public function definition()
    {
        return [
            'tenant_id'     => Tenant::factory(),
            'plan_id'       => Plan::factory(),
            'status'        => 'trial',
            'trial_ends_at' => now()->addDays(14),
            'starts_at'     => now(),
            'ends_at'       => now()->addMonth(),
            'billing_cycle' => 'monthly',
            'amount'        => fake()->numberBetween(5000, 150000),
        ];
    }

    public function active(): static
    {
        return $this->state(fn() => ['status' => 'active', 'trial_ends_at' => null]);
    }

    public function canceled(): static
    {
        return $this->state(fn() => ['status' => 'canceled', 'canceled_at' => now()]);
    }
}
