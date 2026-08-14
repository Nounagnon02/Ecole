<?php

namespace Database\Factories\Universite;

use App\Models\Universite\AnneeAcademique;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnneeAcademiqueFactory extends Factory
{
    protected $model = AnneeAcademique::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-1 year', 'now');

        return [
            'libelle'    => $start->format('Y') . '-' . ((int) $start->format('Y') + 1),
            'date_debut' => $start->format('Y-m-d'),
            'date_fin'   => (clone $start)->modify('+1 year')->format('Y-m-d'),
        ];
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => ['ecole_id' => $school->id]);
    }
}