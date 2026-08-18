<?php

namespace App\Policies;

use App\Models\User;
use App\Models\EmploiDuTemps;
use App\Support\Roles;

class EmploiDuTempsPolicy
{
    public function viewAny(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'censeur', 'surveillant']);
    }

    public function view(User $user, EmploiDuTemps $emploi): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire', 'censeur', 'surveillant']);
    }

    public function create(User $user): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function update(User $user, EmploiDuTemps $emploi): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }

    public function delete(User $user, EmploiDuTemps $emploi): bool
    {
        return Roles::satisfies($user->role, ['directeur', 'secretaire']);
    }
}
