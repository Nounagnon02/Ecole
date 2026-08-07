<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory du modèle App\Models\Eleve.
 *
 * Les colonnes de `eleves` sont : user_id, numero_matricule, date_naissance,
 * lieu_naissance, sexe, classe_id, serie_id, ecole_id. L'identité vit sur
 * `users`, et la clé de classe est `classe_id`.
 */
class EleveFactory extends Factory
{
    protected $model = \App\Models\Eleve::class;

    public function definition()
    {
        $ecole = Ecole::factory();

        return [
            'user_id'          => User::factory()->state(['role' => 'eleve', 'ecole_id' => $ecole]),
            'numero_matricule' => 'MAT-' . fake()->unique()->numerify('######'),
            'date_naissance'   => fake()->date(),
            'lieu_naissance'   => fake()->city(),
            'sexe'             => fake()->randomElement(['M', 'F']),
            'classe_id'         => Classes::factory()->state(['ecole_id' => $ecole]),
            'serie_id'         => null,
            'ecole_id'         => $ecole,
        ];
    }

    /**
     * Rattache l'élève ET son utilisateur à la même école.
     *
     * `Eleve::factory()->create(['ecole_id' => $e->id])` ne suffit pas : le
     * User imbriqué dans definition() résout sa propre Ecole::factory(), donc
     * l'utilisateur finit dans un autre établissement. Le global scope
     * BelongsToEcole masque alors les enregistrements au compte de test, et
     * les requêtes échouent en « No query results » — un faux négatif
     * difficile à diagnostiquer.
     */
    public function forSchool(\App\Models\Ecole $ecole): static
    {
        return $this->state(fn() => [
            'ecole_id' => $ecole->id,
            'user_id'  => \App\Models\User::factory()->state([
                'role' => 'eleve',
                'ecole_id' => $ecole->id,
            ]),
            'classe_id' => \App\Models\Classes::factory()->state(['ecole_id' => $ecole->id]),
        ]);
    }
}