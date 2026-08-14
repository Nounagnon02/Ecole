<?php

namespace Database\Factories;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnseignantFactory extends Factory
{
    protected $model = \App\Models\Enseignant::class;

    public function definition()
    {
        $school = Ecole::factory();

        return [
            // `enseignants` carries no name: identity lives on `users`.
            'user_id'        => User::factory()->state(['role' => 'enseignant', 'ecole_id' => $school]),
            'specialite'     => fake()->randomElement(['Mathématiques', 'Lettres', 'Sciences', 'Langues']),
            'grade'          => fake()->randomElement(['Certifié', 'Agrégé', 'Vacataire']),
            'date_naissance' => fake()->date(),
            'lieu_naissance' => fake()->city(),
            'sexe'           => fake()->randomElement(['M', 'F']),
            'ecole_id'       => $school,
        ];
    }

    /** Attach the teacher and their user account to the same school. */
    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id' => $school->id,
            'user_id'  => User::factory()->state([
                'role'     => 'enseignant',
                'ecole_id' => $school->id,
            ]),
        ]);
    }
}
