<?php

namespace Database\Factories;

use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementEleveFactory extends Factory
{
    protected $model = \App\Models\PaiementEleve::class;

    public function definition()
    {
        return [
            'eleve_id' => Eleve::factory(),
            'montant' => fake()->randomFloat(2, 1000, 100000),
            'type_paiement' => fake()->randomElement(['frais_scolaire', 'cantine', 'transport']),
            'date_paiement' => fake()->date(),
            'statut' => fake()->randomElement(['payé', 'en_attente', 'en_retard']),
        ];
    }
}
