<?php

namespace App\Policies;

use App\Models\Moyennes;
use App\Models\User;
use App\Support\Roles;

class MoyennesPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'censeur', 'parent', 'eleve']);
    }

    public function view(User $user, Moyennes $moyenne): bool
    {
        if (Roles::isDirector($user->role)) {
            return true;
        }

        if ($user->role === 'eleve') {
            return $moyenne->eleve_id === $user->eleve?->id;
        }

        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $moyenne->eleve_id)->exists() ?? false;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant']);
    }
}
