<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Enseignant;
use App\Models\Universite\Filiere;
use App\Models\Universite\Matiere;
use App\Models\Universite\Semestre;
use Illuminate\Database\Eloquent\Factories\Factory;

class MatiereFactory extends Factory
{
    protected $model = Matiere::class;

    public function definition(): array
    {
        return [
            'code'          => strtoupper(fake()->unique()->lexify('UE???')),
            'intitule'      => ucfirst(fake()->words(3, true)),
            'credit'        => fake()->numberBetween(1, 6),
            'enseignant_id' => Enseignant::factory(),
            'semestre_id'   => Semestre::factory(),
            'filiere_id'    => Filiere::factory(),
        ];
    }
}
