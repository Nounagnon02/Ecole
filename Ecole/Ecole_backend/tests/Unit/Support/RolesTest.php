<?php

namespace Tests\Unit\Support;

use App\Support\Roles;
use Tests\TestCase;

class RolesTest extends TestCase
{
    /** @test */
    public function comptable_directeur_admin_and_super_admin_require_two_factor()
    {
        $this->assertTrue(Roles::requiresTwoFactor(Roles::COMPTABLE));
        $this->assertTrue(Roles::requiresTwoFactor(Roles::DIRECTOR));
        $this->assertTrue(Roles::requiresTwoFactor(Roles::ADMIN));
        $this->assertTrue(Roles::requiresTwoFactor(Roles::SUPER_ADMIN));
    }

    /**
     * `satisfies()` expands families: gating on `directeur` already admits
     * the three cycle heads (`directeurM/P/S`) — this must inherit that for
     * free, not enumerate the family a second time.
     *
     * @test
     */
    public function cycle_heads_inherit_the_requirement_from_directeur()
    {
        $this->assertTrue(Roles::requiresTwoFactor(Roles::DIRECTOR_KINDERGARTEN));
        $this->assertTrue(Roles::requiresTwoFactor(Roles::DIRECTOR_PRIMARY));
        $this->assertTrue(Roles::requiresTwoFactor(Roles::DIRECTOR_SECONDARY));
    }

    /** @test */
    public function other_roles_do_not_require_two_factor()
    {
        foreach ([Roles::TEACHER, Roles::ELEVE, Roles::PARENT, Roles::SECRETAIRE, Roles::SURVEILLANT] as $role) {
            $this->assertFalse(Roles::requiresTwoFactor($role));
        }
    }

    /** @test */
    public function null_role_does_not_require_two_factor()
    {
        $this->assertFalse(Roles::requiresTwoFactor(null));
    }
}
