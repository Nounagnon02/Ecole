<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SeriesFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom' => fake()->randomElement(['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale', 'Tle', 'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2']),
            'ecole_id' => null,
        ];
    }
}
