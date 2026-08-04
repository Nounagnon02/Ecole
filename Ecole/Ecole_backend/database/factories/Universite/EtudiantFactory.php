<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Etudiant;
use App\Models\Universite\Filiere;
use Illuminate\Database\Eloquent\Factories\Factory;

class EtudiantFactory extends Factory
{
    protected $model = Etudiant::class;

    public function definition(): array
    {
        return [
            // Unique per school since 2026_08_03_120000, so a value unique in
            // the run is enough and two schools may share a numbering scheme.
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
        ];
    }

    /** Attach a login account — the link this whole change is about. */
    public function forUser(\App\Models\User $user): static
    {
        return $this->state(fn() => ['user_id' => $user->id]);
    }
}
