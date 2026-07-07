<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClasseFactory extends Factory
{
    protected $model = \App\Models\Classe::class;

    public function definition()
    {
        return [
            'nom_classe' => fake()->randomElement(['6e A', '5e B', '4e C', '3e A', '2nde A', '1ère D', 'Tle A']),
            'categorie_classe' => fake()->randomElement(['primaire', 'secondaire']),
        ];
    }
}
