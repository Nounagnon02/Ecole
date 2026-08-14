<?php

namespace Tests;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Authenticate as a user belonging to a school, and return that school.
     *
     * Nearly every business model carries the BelongsToEcole global scope,
     * which resolves the current school from the authenticated user. With no
     * authenticated user the scope falls back to `where 1 = 0` — it fails
     * closed — so a test that creates records without signing in gets an empty
     * result set from every query, and relations resolve to null. That reads
     * like a broken model but is the tenant isolation doing its job.
     *
     * Use this at the top of any test that touches tenant-scoped data.
     */
    protected function actingInSchool(?Ecole $school = null, string $role = 'directeur'): Ecole
    {
        $school = $school ?: Ecole::factory()->create();

        $this->actingAs(User::factory()->create([
            'role'     => $role,
            'ecole_id' => $school->id,
        ]));

        return $school;
    }
}
