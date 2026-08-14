<?php

namespace Database\Factories;

use App\Models\Eleve;
use App\Models\Classes;
use App\Models\Matieres;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotesFactory extends Factory
{
    protected $model = \App\Models\Notes::class;

    public function definition()
    {
        return [
            'eleve_id' => Eleve::factory(),
            // Le modèle s'appelle Matieres (pluriel) : App\Models\Matiere
            // n'existe pas et la factory levait « Class not found ».
            'matiere_id' => Matieres::factory(),
            'classe_id' => Classes::factory(),
            'note' => fake()->randomFloat(2, 0, 20),
            'note_sur' => 20,
            'type_evaluation' => 'Devoir1',
            'periode' => 'trimestre1',
            'date_evaluation' => fake()->date(),
        ];
    }
}
