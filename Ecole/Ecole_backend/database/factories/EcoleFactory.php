<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class EcoleFactory extends Factory
{
    protected $model = \App\Models\Ecole::class;

    public function definition()
    {
        $nom = 'École ' . fake()->unique()->company();

        return [
            'nom'     => $nom,
            'email'   => fake()->unique()->safeEmail(),
            'adresse' => fake()->streetAddress(),
            'phone'   => fake()->numerify('##########'),
            'status'  => 'active',
            'ville'   => fake()->city(),
            'pays'    => 'Bénin',
            'slug'    => Str::slug($nom) . '-' . fake()->unique()->randomNumber(4),
        ];
    }
}
