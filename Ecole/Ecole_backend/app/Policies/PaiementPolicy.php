<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Paiement;
use App\Models\PaiementEleve;

class PaiementPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['directeur', 'comptable', 'secretaire']);
    }

    public function view(User $user, PaiementEleve $paiement): bool
    {
        if (in_array($user->role, ['directeur', 'comptable', 'secretaire'])) return true;
        // Parent voit les paiements de ses enfants
        if ($user->role === 'parent') {
            return $user->parent?->eleves()->where('eleves.id', $paiement->eleve_id)->exists() ?? false;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['directeur', 'comptable', 'secretaire']);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, ['directeur', 'comptable']);
    }

    public function delete(User $user): bool
    {
        return $user->role === 'directeur';
    }
}
