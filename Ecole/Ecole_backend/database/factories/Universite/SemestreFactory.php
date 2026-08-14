<?php

namespace Database\Factories\Universite;

use App\Models\Universite\AnneeAcademique;
use App\Models\Universite\Semestre;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class SemestreFactory extends Factory
{
    protected $model = Semestre::class;

    public function definition(): array
    {
        return [
            'libelle'             => fake()->randomElement(['S1', 'S2', 'S3', 'S4']),
            'annee_academique_id' => AnneeAcademique::factory(),
        ];
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'             => $school->id,
            'annee_academique_id'  => AnneeAcademique::factory()->forSchool($school),
        ]);
    }
}