<?php

namespace Database\Factories;

use App\Models\Eleve;
use App\Models\Matiere;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotesFactory extends Factory
{
    protected $model = \App\Models\Notes::class;

    public function definition()
    {
        return [
            'eleve_id' => Eleve::factory(),
            'matiere_id' => Matiere::factory(),
            'note' => fake()->randomFloat(2, 0, 20),
            'periode' => 'trimestre1',
            'date_evaluation' => fake()->date(),
        ];
    }
}
