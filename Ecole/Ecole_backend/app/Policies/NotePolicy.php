<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Notes;

class NotePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['directeur', 'enseignant', 'censeur', 'parent', 'eleve']);
    }

    public function view(User $user, Notes $note): bool
    {
        // Directeur voit tout
        if ($user->role === 'directeur') return true;
        // Enseignant voit les notes qu'il a saisies
        if ($user->role === 'enseignant') return $note->enseignant_id === $user->id || $note->enseignant_id === $user->enseignant?->id;
        // Élève voit ses propres notes
        if ($user->role === 'eleve') return $note->eleve_id === $user->eleve?->id;
        // Parent voit les notes de ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $note->eleve_id)->exists() ?? false;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['directeur', 'enseignant']);
    }

    public function update(User $user, Notes $note): bool
    {
        if ($user->role === 'directeur') return true;
        return $user->role === 'enseignant' && ($note->enseignant_id === $user->id || $note->enseignant_id === $user->enseignant?->id);
    }

    public function delete(User $user, Notes $note): bool
    {
        return $user->role === 'directeur';
    }
}
