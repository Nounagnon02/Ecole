<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MatieresFactory extends Factory
{
    protected $model = \App\Models\Matieres::class;

    public function definition()
    {
        // La table `matieres` n'a qu'une colonne métier : `nom`. Ni
        // `nom_matiere`, ni `code_matiere`, ni `coefficient` (ce dernier vit
        // sur le pivot serie_matieres).
        return [
            'nom' => fake()->randomElement([
                'Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie',
                'SVT', 'Physique-Chimie', 'EPS', 'Philosophie',
            ]) . ' ' . fake()->unique()->numerify('##'),
        ];
    }
}
