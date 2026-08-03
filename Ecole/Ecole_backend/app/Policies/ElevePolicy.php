<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Eleve;
use App\Support\Roles;

class ElevePolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'censeur', 'surveillant', 'infirmier', 'bibliothecaire', 'secretaire']);
    }

    public function view(User $user, Eleve $eleve): bool
    {
        if (Roles::isDirector($user->role)) return true;
        // Enseignant voit les élèves de sa classe.
        // `class_id` — la colonne `eleves.classe_id` n'existe pas, donc la
        // comparaison portait sur null et aucun enseignant ne pouvait voir
        // aucun élève.
        if ($user->role === 'enseignant') {
            return $user->enseignant?->classes()->where('classes.id', $eleve->class_id)->exists() ?? false;
        }
        // Parent voit ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $eleve->id)->exists() ?? false;
        }
        // Élève voit lui-même
        if ($user->role === 'eleve') return $user->eleve?->id === $eleve->id;
        return in_array($user->role, ['censeur', 'surveillant', 'infirmier', 'secretaire'], true);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, Eleve $eleve): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, Eleve $eleve): bool
    {
        return Roles::isDirector($user->role);
    }
}
