<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Communication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommunicationFactory extends Factory
{
    protected $model = Communication::class;

    public function definition(): array
    {
        return [
            'auteur_id' => User::factory()->role('directeur'),
            'titre'     => ucfirst(fake()->words(4, true)),
            'contenu'   => fake()->paragraph(),
            'categorie' => Communication::CATEGORY_INFO,
            'audience'  => Communication::AUDIENCE_SCHOOL,
            'tags'      => ['test'],
            'epingle'   => false,
            'publie_le' => now(),
        ];
    }

    public function forCycle(string $cycle): static
    {
        return $this->state(fn() => [
            'audience'       => Communication::AUDIENCE_CYCLE,
            'audience_cycle' => $cycle,
        ]);
    }

    public function forClass(Classes|int $classe): static
    {
        return $this->state(fn() => [
            'audience'  => Communication::AUDIENCE_CLASS,
            'classe_id' => $classe instanceof Classes ? $classe->id : $classe,
        ]);
    }

    public function forRole(string $role): static
    {
        return $this->state(fn() => [
            'audience'      => Communication::AUDIENCE_ROLE,
            'audience_role' => $role,
        ]);
    }

    public function pinned(): static
    {
        return $this->state(fn() => ['epingle' => true]);
    }

    /** Published in the future — must stay out of every feed until then. */
    public function scheduled(): static
    {
        return $this->state(fn() => ['publie_le' => now()->addWeek()]);
    }

    /** Its window has closed; the row survives, the notice does not show. */
    public function expired(): static
    {
        return $this->state(fn() => [
            'publie_le' => now()->subMonth(),
            'expire_le' => now()->subDay(),
        ]);
    }
}
