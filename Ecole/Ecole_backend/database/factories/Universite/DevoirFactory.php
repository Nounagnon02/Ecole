<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Devoir;
use App\Models\Universite\Matiere;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class DevoirFactory extends Factory
{
    protected $model = Devoir::class;

    public function definition(): array
    {
        return [
            'titre'       => ucfirst(fake()->words(4, true)),
            'description' => fake()->sentence(),
            'type'        => fake()->randomElement(Devoir::TYPES),
            'priorite'    => fake()->randomElement(Devoir::PRIORITIES),
            'statut'      => 'en_cours',
            'date_limite' => now()->addDays(14),
            'publie'      => true,
            'matiere_id'  => Matiere::factory(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn() => ['publie' => false]);
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'   => $school->id,
            'matiere_id' => Matiere::factory()->forSchool($school),
        ]);
    }
}