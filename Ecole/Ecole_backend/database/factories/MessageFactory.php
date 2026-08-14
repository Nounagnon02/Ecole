<?php

namespace Database\Factories;

use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = \App\Models\Message::class;

    public function definition()
    {
        return [
            'ecole_id'     => Ecole::factory(),
            'expediteur'   => (string) fake()->numberBetween(1, 1000),
            'destinataire' => (string) fake()->numberBetween(1, 1000),
            'sujet'        => fake()->sentence(4),
            'contenu'      => fake()->paragraph(),
            'lu'           => false,
        ];
    }
}
