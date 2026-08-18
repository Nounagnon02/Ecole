<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Personnel;
use App\Support\Roles;

class PersonnelPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::isDirector($user->role);
    }

    public function view(User $user, Personnel $personnel): bool
    {
        return Roles::isDirector($user->role);
    }

    public function create(User $user): bool
    {
        return Roles::isDirector($user->role);
    }

    public function update(User $user, Personnel $personnel): bool
    {
        return Roles::isDirector($user->role);
    }

    public function delete(User $user, Personnel $personnel): bool
    {
        return Roles::isDirector($user->role);
    }
}
