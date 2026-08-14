<?php

namespace Database\Factories;

use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory du modèle App\Models\Classes.
 *
 * Nommée `ClassesFactory` et non `ClasseFactory` : Eloquent résout la factory
 * d'après le nom du modèle. L'ancien fichier ciblait `App\Models\Classe`, une
 * classe qui n'existe pas — tout test l'utilisant échouait.
 */
class ClassesFactory extends Factory
{
    protected $model = \App\Models\Classes::class;

    public function definition()
    {
        return [
            'nom_classe' => fake()->unique()->randomElement([
                '6e A', '5e B', '4e C', '3e A', '2nde A', '1ère D', 'Tle A',
                '6e B', '5e A', '4e A', '3e B', '2nde C', '1ère C', 'Tle D',
            ]),
            'categorie_classe' => fake()->randomElement(['primaire', 'secondaire']),
            'ecole_id' => Ecole::factory(),
        ];
    }
}
