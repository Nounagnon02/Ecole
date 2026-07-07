<?php

namespace Database\Factories;

use App\Models\Classe;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EleveFactory extends Factory
{
    protected $model = \App\Models\Eleve::class;

    public function definition()
    {
        return [
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'numero_matricule' => 'MAT-' . fake()->unique()->randomNumber(6),
            'classe_id' => Classe::factory(),
            'user_id' => User::factory(),
            'date_naissance' => fake()->date(),
            'lieu_naissance' => fake()->city(),
            'sexe' => fake()->randomElement(['M', 'F']),
        ];
    }
}
