<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Departement;
use App\Models\Universite\Enseignant;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnseignantFactory extends Factory
{
    protected $model = Enseignant::class;

    public function definition(): array
    {
        return [
            'nom'            => fake()->lastName(),
            'prenom'         => fake()->firstName(),
            'grade'          => fake()->randomElement(['Assistant', 'Maître-assistant', 'Professeur']),
            'specialite'     => fake()->word(),
            'email'          => fake()->unique()->safeEmail(),
            'departement_id' => Departement::factory(),
        ];
    }

    /** Attach a login account, so "my courses" can resolve this lecturer. */
    public function forUser(\App\Models\User $user): static
    {
        return $this->state(fn() => ['user_id' => $user->id, 'ecole_id' => $user->ecole_id]);
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'       => $school->id,
            'departement_id' => Departement::factory()->forSchool($school),
        ]);
    }
}