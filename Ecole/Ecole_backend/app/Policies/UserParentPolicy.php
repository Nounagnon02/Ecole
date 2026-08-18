<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserParent;
use App\Support\Roles;

class UserParentPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'comptable', 'censeur']);
    }

    public function view(User $user, UserParent $parent): bool
    {
        if (Roles::isDirector($user->role)) return true;
        if ($user->role === 'parent') {
            return $user->parent?->id === $parent->id;
        }
        return in_array($user->role, ['secretaire', 'comptable', 'censeur'], true);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, UserParent $parent): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, UserParent $parent): bool
    {
        return Roles::isDirector($user->role);
    }
}
