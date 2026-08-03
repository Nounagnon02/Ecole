<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            // `identifiant` est unique en base : sans valeur explicite, deux
            // utilisateurs créés dans le même test entraient en collision sur
            // NULL selon le moteur.
            'identifiant' => 'U' . fake()->unique()->numerify('#######'),
            'name' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'telephone' => fake()->numerify('##########'),
            'role' => 'eleve',
            'email_verified_at' => now(),
            // Mot de passe en clair : le cast `hashed` du modèle s'en charge,
            // au coût configuré. Un hash codé en dur (coût 10) échouait la
            // vérification de configuration quand BCRYPT_ROUNDS vaut 4 en test.
            'password' => 'password',
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * `is_active` est dans $guarded : il ne passe pas par le mass-assignment
     * de la factory et doit être posé après création.
     */
    public function inactif()
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            $user->forceFill(['is_active' => false])->save();
        });
    }

    /** Raccourci de lisibilité : User::factory()->role('directeur') */
    public function role(string $role)
    {
        return $this->state(fn() => ['role' => $role]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     *
     * @return static
     */
    public function unverified()
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
