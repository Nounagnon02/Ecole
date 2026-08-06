<?php

namespace Database\Factories\Universite;

use App\Models\Universite\EmploiDuTemps;
use App\Models\Universite\Enseignant;
use App\Models\Universite\Filiere;
use App\Models\Universite\Matiere;
use App\Models\Universite\Semestre;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmploiDuTempsFactory extends Factory
{
    protected $model = EmploiDuTemps::class;

    public function definition(): array
    {
        return [
            'titre'         => ucfirst(fake()->words(3, true)),
            'type'          => fake()->randomElement(EmploiDuTemps::TYPES),
            'date'          => now()->addDays(fake()->numberBetween(1, 30))->format('Y-m-d'),
            'heure_debut'   => '08:00',
            'heure_fin'     => '10:00',
            'salle'         => 'Amphi ' . fake()->randomLetter(),
            'statut'        => 'planifie',
            'matiere_id'    => Matiere::factory(),
            'enseignant_id' => Enseignant::factory(),
            'semestre_id'   => Semestre::factory(),
            'filiere_id'    => Filiere::factory(),
        ];
    }

    public function done(): static
    {
        return $this->state(fn() => [
            'statut' => 'termine',
            'date'   => now()->subDays(7)->format('Y-m-d'),
        ]);
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'      => $school->id,
            'matiere_id'    => Matiere::factory()->forSchool($school),
            'enseignant_id' => Enseignant::factory()->forSchool($school),
            'semestre_id'   => Semestre::factory()->forSchool($school),
            'filiere_id'    => Filiere::factory()->forSchool($school),
        ]);
    }
}