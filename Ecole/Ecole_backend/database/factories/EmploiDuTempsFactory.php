<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EmploiDuTempsFactory extends Factory
{
    public function definition(): array
    {
        return [
            'jour' => fake()->randomElement(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']),
            'heure_debut' => fake()->time('08:00', '17:00'),
            'heure_fin' => fake()->time('08:00', '18:00'),
            'salle' => fake()->randomElement(['S101', 'S102', 'S201', 'Labo', 'Bibliothèque']),
            'classe_id' => \App\Models\Classes::factory(),
            'matiere_id' => \App\Models\Matieres::factory(),
            'enseignant_id' => \App\Models\Enseignant::factory(),
            'ecole_id' => null,
        ];
    }
}
