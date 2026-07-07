<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Absence;

class AbsencePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['directeur', 'enseignant', 'surveillant', 'censeur', 'parent']);
    }

    public function view(User $user, Absence $absence): bool
    {
        if (in_array($user->role, ['directeur', 'surveillant', 'censeur'])) return true;
        // Enseignant voit les absences de sa classe
        if ($user->role === 'enseignant') {
            return $user->enseignant?->classes()->where('classes.id', $absence->eleve->classe_id)->exists() ?? false;
        }
        // Parent voit les absences de ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $absence->eleve_id)->exists() ?? false;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['directeur', 'enseignant', 'surveillant']);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, ['directeur', 'surveillant']);
    }

    public function delete(User $user): bool
    {
        return $user->role === 'directeur';
    }
}
