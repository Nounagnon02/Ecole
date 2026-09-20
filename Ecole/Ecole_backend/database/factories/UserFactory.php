<?php

namespace Database\Factories;

use App\Support\Roles;
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
            // `null`, pas `false` : une sentinelle pour distinguer « jamais
            // fixé » de « explicitement désactivé » dans `configure()`
            // ci-dessous — voir ce commentaire pour le pourquoi.
            'two_factor_enabled' => null,
        ];
    }

    /**
     * Un compte comptable/directeur/admin/super-admin part activé.
     *
     * `Roles::requiresTwoFactor()` bloque tout rôle qui l'exige et n'a pas
     * encore activé la 2FA (VerifyTwoFactor) sur tout sauf les routes
     * d'enrôlement. Sans ceci, chaque test créant un tel utilisateur via
     * `actingAs()` pour exercer autre chose (paiements, tableaux de bord,
     * SaaS...) se serait heurté à une 403 qui n'a rien à voir avec ce qu'il
     * teste — près de 200 tests existants l'ont fait la première fois que
     * cette règle a été introduite. Un test qui veut spécifiquement un
     * compte à 2FA obligatoire pas encore activée (le parcours d'enrôlement
     * lui-même, voir MandatoryTwoFactorTest) le redemande explicitement :
     * `User::factory()->create(['role' => 'comptable', 'two_factor_enabled' => false])`
     * — un override explicite gagne toujours sur ce réglage automatique.
     */
    public function configure()
    {
        return $this->afterMaking(function (\App\Models\User $user) {
            // `getRawOriginal()`/`getOriginal()` reflètent l'état synchronisé
            // avec la base — vide pour un modèle jamais persisté, donc
            // toujours `null` ici quelle que soit la valeur réellement
            // affectée. `getAttributes()` lit le tableau brut réellement posé
            // par le constructeur/l'affectation de masse, avant tout cast :
            // c'est la seule des deux qui distingue vraiment « jamais fixé »
            // de « explicitement à false ».
            if (($user->getAttributes()['two_factor_enabled'] ?? null) === null) {
                $user->two_factor_enabled = Roles::requiresTwoFactor($user->role);
            }
        });
    }

    /**
     * `is_active` est dans $guarded : il ne passe pas par le mass-assignment
     * de la factory et doit être posé après création.
     */
    public function inactive()
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
