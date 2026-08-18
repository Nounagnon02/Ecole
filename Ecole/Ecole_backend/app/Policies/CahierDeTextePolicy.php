<?php

namespace App\Policies;

use App\Models\User;
use App\Models\CahierDeTexte;
use App\Support\Roles;

class CahierDeTextePolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'enseignant', 'censeur', 'surveillant']);
    }

    public function view(User $user, CahierDeTexte $cahier): bool
    {
        if (Roles::isDirector($user->role)) return true;
        if ($user->role === 'enseignant') {
            return $user->enseignant?->id === $cahier->enseignant_id;
        }
        return in_array($user->role, ['secretaire', 'censeur', 'surveillant'], true);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant']);
    }

    public function update(User $user, CahierDeTexte $cahier): bool
    {
        if (Roles::isDirector($user->role)) return true;
        if ($user->role === 'enseignant') {
            return $user->enseignant?->id === $cahier->enseignant_id;
        }
        return false;
    }

    public function delete(User $user, CahierDeTexte $cahier): bool
    {
        if (Roles::isDirector($user->role)) return true;
        if ($user->role === 'enseignant') {
            return $user->enseignant?->id === $cahier->enseignant_id;
        }
        return false;
    }
}
