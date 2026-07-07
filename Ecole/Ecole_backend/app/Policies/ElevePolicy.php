<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Eleve;

class ElevePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['directeur', 'enseignant', 'censeur', 'surveillant', 'infirmier', 'bibliothecaire', 'secretaire']);
    }

    public function view(User $user, Eleve $eleve): bool
    {
        if ($user->role === 'directeur') return true;
        // Enseignant voit les élèves de sa classe
        if ($user->role === 'enseignant') {
            return $user->enseignant?->classes()->where('classes.id', $eleve->classe_id)->exists() ?? false;
        }
        // Parent voit ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $eleve->id)->exists() ?? false;
        }
        // Élève voit lui-même
        if ($user->role === 'eleve') return $user->eleve?->id === $eleve->id;
        return in_array($user->role, ['censeur', 'surveillant', 'infirmier', 'secretaire']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, Eleve $eleve): bool
    {
        return in_array($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, Eleve $eleve): bool
    {
        return $user->role === 'directeur';
    }
}
