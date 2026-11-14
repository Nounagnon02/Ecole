<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

/**
 * Filtre « q » de la recherche globale (BUG-007).
 *
 * Chaque mot saisi doit correspondre à au moins une des colonnes : « Kossi
 * AUDIT » trouve l'élève AUDITFICTIF Kossi. `%` et `_` sont échappés : taper
 * « % » ne doit pas tout renvoyer.
 */
final class Recherche
{
    /**
     * @param  callable(Builder, string): void  $correspond  ajoute, pour un
     *                                                       motif LIKE, les conditions « ou » d'un mot
     */
    public static function appliquer(Builder $requete, ?string $q, callable $correspond): Builder
    {
        $mots = preg_split('/\s+/u', trim((string) $q), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach (array_slice($mots, 0, 5) as $mot) {
            $motif = '%'.addcslashes(mb_substr($mot, 0, 50), '\\%_').'%';
            $requete->where(fn (Builder $ou) => $correspond($ou, $motif));
        }

        return $requete;
    }
}
