<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Enseignant;
use App\Support\Roles;

class EnseignantPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'censeur']);
    }

    public function view(User $user, Enseignant $enseignant): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'censeur']);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, Enseignant $enseignant): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, Enseignant $enseignant): bool
    {
        return Roles::isDirector($user->role);
    }
}
