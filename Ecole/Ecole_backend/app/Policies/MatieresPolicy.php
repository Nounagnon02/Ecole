<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Matieres;
use App\Support\Roles;

class MatieresPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'enseignant', 'censeur']);
    }

    public function view(User $user, Matieres $matiere): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'enseignant', 'censeur']);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, Matieres $matiere): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, Matieres $matiere): bool
    {
        return Roles::isDirector($user->role);
    }
}
