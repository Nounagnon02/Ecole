<?php

namespace App\Http\Controllers\Concerns;

use App\Support\Roles;

/**
 * Restreint une requête de lecture à ce que le demandeur peut voir.
 *
 * Le périmètre est celui des notes : la direction et les enseignants voient
 * l'école entière (bornée par le scope tenant), l'élève se voit lui-même,
 * le parent voit ses enfants. Un rôle inattendu ne reçoit rien.
 */
trait ScopesToCaller
{
    protected function restrictToCallerScope($query): void
    {
        $user = auth()->user();
        $staff = Roles::expand([
            Roles::DIRECTOR, Roles::TEACHER, 'censeur', 'secretaire', Roles::SUPER_ADMIN,
        ]);

        if (in_array($user?->role, $staff, true)) {
            return; // périmètre de l'école, déjà borné par le scope tenant
        }

        if ($user?->role === 'eleve' && $user->eleve) {
            $query->where('eleve_id', $user->eleve->id);

            return;
        }

        if ($user?->role === 'parent' && $user->parent) {
            $query->whereIn('eleve_id', $user->parent->eleves()->pluck('eleves.id'));

            return;
        }

        $query->whereRaw('1 = 0');
    }
}
