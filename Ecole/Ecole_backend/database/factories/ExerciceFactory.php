<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ExerciceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'titre' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'classe_id' => \App\Models\Classes::factory(),
            'enseignant_id' => \App\Models\Enseignant::factory(),
            'date_limite' => fake()->dateTimeBetween('now', '+2 weeks'),
            'ecole_id' => null,
        ];
    }
}
