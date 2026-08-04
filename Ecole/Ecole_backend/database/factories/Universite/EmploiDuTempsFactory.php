<?php

namespace Database\Factories\Universite;

use App\Models\Universite\EmploiDuTemps;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmploiDuTempsFactory extends Factory
{
    protected $model = EmploiDuTemps::class;

    public function definition(): array
    {
        return [
            'titre'       => ucfirst(fake()->words(3, true)),
            'type'        => fake()->randomElement(EmploiDuTemps::TYPES),
            'date'        => now()->addDays(fake()->numberBetween(1, 30))->format('Y-m-d'),
            'heure_debut' => '08:00',
            'heure_fin'   => '10:00',
            'salle'       => 'Amphi ' . fake()->randomLetter(),
            'statut'      => 'planifie',
        ];
    }

    public function done(): static
    {
        return $this->state(fn() => [
            'statut' => 'termine',
            'date'   => now()->subDays(7)->format('Y-m-d'),
        ]);
    }
}
