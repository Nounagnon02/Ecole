<?php

namespace Database\Factories;

use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaiementEleveFactory extends Factory
{
    protected $model = \App\Models\PaiementEleve::class;

    public function definition()
    {
        // Colonnes réelles de `paiements` : ni `type_paiement`, ni `statut`.
        // Le statut s'appelle `statut_global`, et le mode de règlement
        // `mode_paiement`.
        $total = fake()->randomFloat(2, 1000, 100000);
        $paye  = fake()->randomFloat(2, 0, $total);

        return [
            'eleve_id'        => Eleve::factory(),
            'montant'         => $total,
            'montant_total'   => $total,
            'montant_paye'    => $paye,
            'montant_restant' => round($total - $paye, 2),
            'mode_paiement'   => fake()->randomElement(['especes', 'mobile_money', 'virement']),
            'date_paiement'   => fake()->date(),
            'statut_global'   => fake()->randomElement(['paye', 'partiel', 'impaye']),
        ];
    }
}
