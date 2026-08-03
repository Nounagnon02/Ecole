<?php

namespace Database\Factories\SaaS;

use App\Models\SaaS\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TenantFactory extends Factory
{
    protected $model = \App\Models\SaaS\Tenant::class;

    public function definition()
    {
        $nom = 'École ' . fake()->unique()->company();
        $slug = Str::slug($nom) . '-' . fake()->unique()->numerify('####');

        return [
            'name'        => $nom,
            'slug'        => $slug,
            'domain'      => $slug . '.example.test',
            'plan_id'     => Plan::factory(),
            'status'      => 'trial',
            'school_type' => fake()->randomElement(['maternelle', 'primaire', 'secondaire', 'universite', 'complexe']),
        ];
    }

    public function actif(): static
    {
        return $this->state(fn() => ['status' => 'active']);
    }

    public function suspendu(): static
    {
        return $this->state(fn() => ['status' => 'suspended']);
    }
}
