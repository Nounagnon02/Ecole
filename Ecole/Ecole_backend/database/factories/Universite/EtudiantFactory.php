<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Etudiant;
use App\Models\Universite\Filiere;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class EtudiantFactory extends Factory
{
    protected $model = Etudiant::class;

    public function definition(): array
    {
        return [
            'matricule'      => 'ETU' . fake()->unique()->numerify('######'),
            'nom'            => fake()->lastName(),
            'prenom'         => fake()->firstName(),
            'date_naissance' => fake()->date(),
            'lieu_naissance' => fake()->city(),
            'sexe'           => fake()->randomElement(['M', 'F']),
            'telephone'      => fake()->numerify('##########'),
            'email'          => fake()->unique()->safeEmail(),
            'annee_entree'   => (int) date('Y'),
            'filiere_id'     => Filiere::factory(),
            'statut'         => 'active',
        ];
    }

    public function forUser(\App\Models\User $user): static
    {
        return $this->state(fn() => ['user_id' => $user->id, 'ecole_id' => $user->ecole_id]);
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id'   => $school->id,
            'filiere_id' => Filiere::factory()->forSchool($school),
        ]);
    }
}