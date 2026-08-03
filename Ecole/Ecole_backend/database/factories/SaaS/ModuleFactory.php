<?php

namespace Database\Factories\SaaS;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ModuleFactory extends Factory
{
    protected $model = \App\Models\SaaS\Module::class;

    public function definition()
    {
        $nom = fake()->randomElement([
            'Bulletins', 'Paiements', 'Messagerie', 'Transport', 'Bibliothèque',
            'Infirmerie', 'Cantine', 'Emploi du temps', 'Discipline',
        ]) . ' ' . fake()->unique()->numerify('###');

        return [
            'slug'           => Str::slug($nom),
            'name'           => $nom,
            'description'    => fake()->sentence(6),
            'is_core'        => false,
            'is_active'      => true,
            'required_roles' => ['directeur'],
        ];
    }

    public function core(): static
    {
        return $this->state(fn() => ['is_core' => true]);
    }
}
