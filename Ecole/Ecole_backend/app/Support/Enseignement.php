<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Classes qu'un enseignant enseigne : par matière (collège, lycée, table
 * `enseignant_matiere`) ou comme maître de la classe (maternelle, primaire,
 * table `enseignants_maternelle_primaire`).
 */
final class Enseignement
{
    public static function estEnseignant(User $user): bool
    {
        return in_array($user->role, Roles::teachers(), true);
    }

    /** @return list<int> */
    public static function classes(User $user): array
    {
        $fiche = DB::table('enseignants')->where('user_id', $user->id)->value('id');

        return collect($fiche ? DB::table('enseignant_matiere')->where('enseignant_id', $fiche)->pluck('classe_id') : [])
            ->merge(DB::table('enseignants_maternelle_primaire')->where('user_id', $user->id)->pluck('classe_id'))
            ->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    public static function enseigneLaClasse(User $user, int $classeId): bool
    {
        return in_array($classeId, self::classes($user), true);
    }
}
