<?php

namespace Database\Factories\Universite;

use App\Models\Universite\Universite;
use App\Models\Ecole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factories for the university module.
 *
 * None existed, which is why the module had one unit test asserting that its
 * models can be instantiated and nothing that touched the database. Every
 * factory here leaves `ecole_id` to `BelongsToEcole`, which fills it from the
 * signed-in user on create — so a test must call `actingInSchool()` first, and
 * the fixtures then land in the right tenant by construction rather than by the
 * test remembering to pass an id.
 */
class UniversiteFactory extends Factory
{
    protected $model = Universite::class;

    public function definition(): array
    {
        return [
            'nom'   => 'Université de ' . fake()->unique()->city(),
            'sigle' => strtoupper(fake()->unique()->lexify('U??')),
        ];
    }

    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => ['ecole_id' => $school->id]);
    }
}