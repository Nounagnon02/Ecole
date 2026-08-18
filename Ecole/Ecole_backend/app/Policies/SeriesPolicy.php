<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Series;
use App\Support\Roles;

class SeriesPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'enseignant', 'censeur']);
    }

    public function view(User $user, Series $serie): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'enseignant', 'censeur']);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, Series $serie): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, Series $serie): bool
    {
        return Roles::isDirector($user->role);
    }
}
