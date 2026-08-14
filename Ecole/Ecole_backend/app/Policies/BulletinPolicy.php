<?php

namespace App\Policies;

use App\Models\Bulletin;
use App\Models\User;
use App\Support\Roles;

class BulletinPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'censeur', 'parent', 'eleve']);
    }

    public function view(User $user, Bulletin $bulletin): bool
    {
        if (Roles::isDirector($user->role)) {
            return true;
        }

        if ($user->role === 'eleve') {
            return $bulletin->eleve_id === $user->eleve?->id;
        }

        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $bulletin->eleve_id)->exists() ?? false;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'censeur']);
    }
}
