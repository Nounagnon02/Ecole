<?php

namespace Database\Factories;

use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class AbsenceFactory extends Factory
{
    protected $model = \App\Models\Absence::class;

    public function definition()
    {
        return [
            'eleve_id' => Eleve::factory(),
            'date' => fake()->date(),
            'motif' => fake()->randomElement(['Maladie', 'Familial', 'Transport', 'Autre']),
            // La colonne est `justifiee` (deux e), pas `justifie`.
            'justifiee' => fake()->boolean(),
            'type' => fake()->randomElement(['absence', 'retard']),
        ];
    }
}
