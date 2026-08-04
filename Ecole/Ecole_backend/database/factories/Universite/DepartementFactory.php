<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Departement;
use App\Models\Universite\Faculte;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepartementFactory extends Factory
{
    protected $model = Departement::class;

    public function definition(): array
    {
        return [
            'nom'         => 'Département ' . fake()->unique()->word(),
            'faculte_id'  => Faculte::factory(),
        ];
    }
}
