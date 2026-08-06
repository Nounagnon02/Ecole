<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Faculte;
use App\Models\Universite\Universite;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class FaculteFactory extends Factory
{
    protected $model = Faculte::class;

    public function definition(): array
    {
        return [
            'nom'           => 'Faculté ' . fake()->unique()->word(),
            'sigle'         => strtoupper(fake()->unique()->lexify('F??')),
            'universite_id' => Universite::factory(),
        ];
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'       => $school->id,
            'universite_id'  => Universite::factory()->forSchool($school),
        ]);
    }
}