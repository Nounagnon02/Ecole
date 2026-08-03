<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MatieresFactory extends Factory
{
    protected $model = \App\Models\Matieres::class;

    public function definition()
    {
        return [
            'nom_matiere' => fake()->randomElement(['Mathématiques', 'Français', 'Anglais', 'Physique', 'SVT', 'Histoire-Géo']),
            'code_matiere' => strtoupper(fake()->lexify('???')),
        ];
    }
}
