<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Departement;
use App\Models\Universite\Filiere;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class FiliereFactory extends Factory
{
    protected $model = Filiere::class;

    public function definition(): array
    {
        return [
            'nom'            => 'Filière ' . fake()->unique()->word(),
            'niveau'         => fake()->randomElement(['Licence', 'Master', 'Doctorat']),
            'departement_id' => Departement::factory(),
        ];
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'       => $school->id,
            'departement_id' => Departement::factory()->forSchool($school),
        ]);
    }
}