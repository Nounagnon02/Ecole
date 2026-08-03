<?php

namespace Database\Factories\SaaS;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PlanFactory extends Factory
{
    protected $model = \App\Models\SaaS\Plan::class;

    public function definition()
    {
        // `unique()->randomElement()` sur une liste courte épuise le
        // générateur au-delà de 5 plans et lève OverflowException.
        $nom = fake()->randomElement(['Essentiel', 'Standard', 'Premium', 'Établissement', 'Réseau'])
            . ' ' . fake()->unique()->numerify('###');

        return [
            'name'          => $nom,
            'slug'          => Str::slug($nom) . '-' . fake()->unique()->numerify('###'),
            'description'   => fake()->sentence(8),
            'price_monthly' => fake()->numberBetween(5000, 150000),
            'price_yearly'  => fake()->numberBetween(50000, 1500000),
            'max_students'  => fake()->randomElement([100, 500, 2000, null]),
            'max_schools'   => fake()->numberBetween(1, 10),
            'features'      => ['bulletins', 'paiements', 'messagerie'],
            'modules'       => ['core'],
            'is_popular'    => false,
            'is_active'     => true,
        ];
    }

    public function inactif(): static
    {
        return $this->state(fn() => ['is_active' => false]);
    }
}
