<?php

namespace Database\Factories;

use App\Models\Ecole;
use App\Models\Eleve;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = \App\Models\Payment::class;

    public function definition()
    {
        return [
            'eleve_id'    => Eleve::factory(),
            'ecole_id'    => Ecole::factory(),
            'amount'      => fake()->numberBetween(5000, 250000),
            'currency'    => 'XOF',
            'type'        => fake()->randomElement(['scolarite', 'cantine', 'transport', 'autre']),
            'description' => fake()->sentence(5),
            'status'      => 'pending',
        ];
    }

    /** Paiement confirmé par le provider. */
    public function complete(): static
    {
        return $this->state(fn() => [
            'status'         => 'completed',
            'transaction_id' => 'tx_' . fake()->unique()->randomNumber(8),
            'paid_at'        => now(),
            'payment_method' => 'mobile_money',
        ]);
    }
}
