<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Absence;
use App\Support\Roles;

class AbsencePolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'surveillant', 'censeur', 'parent']);
    }

    public function view(User $user, Absence $absence): bool
    {
        if (Roles::satisfies($user->role, ['directeur', 'surveillant', 'censeur'])) return true;
        // Enseignant voit les absences de sa classe.
        // `class_id`, et `?->` sur l'élève : `eleves.classe_id` n'existe pas, et
        // une absence dont l'élève a disparu faisait planter la vérification au
        // lieu de la refuser.
        if ($user->role === 'enseignant') {
            $classId = $absence->eleve?->classe_id;

            return $classId !== null
                && ($user->enseignant?->classes()->where('classes.id', $classId)->exists() ?? false);
        }
        // Parent voit les absences de ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $absence->eleve_id)->exists() ?? false;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'surveillant']);
    }

    public function update(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'surveillant']);
    }

    public function delete(User $user): bool
    {
        return Roles::isDirector($user->role);
    }
}
