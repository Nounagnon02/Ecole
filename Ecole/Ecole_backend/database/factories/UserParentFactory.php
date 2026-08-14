<?php

namespace Database\Factories;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserParentFactory extends Factory
{
    protected $model = \App\Models\UserParent::class;

    public function definition()
    {
        $school = Ecole::factory();

        return [
            'user_id'    => User::factory()->state(['role' => 'parent', 'ecole_id' => $school]),
            'profession' => fake()->jobTitle(),
            'adresse'    => fake()->streetAddress(),
            'ecole_id'   => $school,
        ];
    }

    /**
     * Attach the parent and their user account to the same school.
     *
     * Same reason as EleveFactory::forSchool — overriding `ecole_id` alone
     * leaves the nested user in a different school, and the tenant scope then
     * hides the record from the test's authenticated account.
     */
    public function forSchool(Ecole $school): static
    {
        return $this->state(fn() => [
            'ecole_id' => $school->id,
            'user_id'  => User::factory()->state([
                'role'     => 'parent',
                'ecole_id' => $school->id,
            ]),
        ]);
    }
}
