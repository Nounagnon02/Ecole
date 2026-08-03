<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Notes;
use App\Support\Roles;

class NotePolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'enseignant', 'censeur', 'parent', 'eleve']);
    }

    public function view(User $user, Notes $note): bool
    {
        // Directeur voit tout
        if (Roles::isDirector($user->role)) return true;
        // Enseignant voit les notes qu'il a saisies
        if ($user->role === 'enseignant') return $this->isAuthor($user, $note);
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
        return Roles::satisfies($user->role, ['directeur', 'enseignant']);
    }

    public function update(User $user, Notes $note): bool
    {
        if (Roles::isDirector($user->role)) return true;

        return $user->role === 'enseignant' && $this->isAuthor($user, $note);
    }

    public function delete(User $user, Notes $note): bool
    {
        return Roles::isDirector($user->role);
    }

    /**
     * Did this teacher enter the mark?
     *
     * The check used to read `$note->enseignant_id`, comparing it against both
     * `$user->id` and `$user->enseignant?->id` — as if hedging over which id
     * space the column used. `notes` has no `enseignant_id` column at all: the
     * author is `created_by`, a foreign key to `users`. So the expression was
     * `null === int || null === int`, false on both sides, and **no teacher
     * could ever view or update a mark** — not even one they had just entered.
     * The two-sided comparison hid the mistake by looking like a deliberate
     * fallback.
     */
    private function isAuthor(User $user, Notes $note): bool
    {
        return $note->created_by !== null && (int) $note->created_by === (int) $user->id;
    }
}
