<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Expressions SQL de date portables entre pilotes.
 *
 * Les agrégations par mois écrivaient `MONTH()`, `YEAR()` ou `DATE_FORMAT()`,
 * propres à MySQL ; la suite de tests de la CI tourne sur SQLite, où elles
 * échouent (R-47, 16/11/2026). Toute expression de ce genre passe par ici.
 *
 * Les colonnes sont des identifiants écrits dans le code, jamais une entrée
 * de l'utilisateur : elles ne sont pas échappées.
 */
final class Sql
{
    private const PILOTES = ['mysql', 'mariadb', 'sqlite', 'pgsql'];

    /** Numéro du mois (1–12) d'une colonne date, en entier. */
    public static function mois(string $colonne, ?string $pilote = null): string
    {
        return match (self::pilote($pilote)) {
            'mysql', 'mariadb' => "MONTH({$colonne})",
            'sqlite' => "CAST(strftime('%m', {$colonne}) AS INTEGER)",
            'pgsql' => "EXTRACT(MONTH FROM {$colonne})::int",
        };
    }

    /** Année (quatre chiffres) d'une colonne date, en entier. */
    public static function annee(string $colonne, ?string $pilote = null): string
    {
        return match (self::pilote($pilote)) {
            'mysql', 'mariadb' => "YEAR({$colonne})",
            'sqlite' => "CAST(strftime('%Y', {$colonne}) AS INTEGER)",
            'pgsql' => "EXTRACT(YEAR FROM {$colonne})::int",
        };
    }

    /** Mois calendaire « AAAA-MM » d'une colonne date. */
    public static function anneeMois(string $colonne, ?string $pilote = null): string
    {
        return match (self::pilote($pilote)) {
            'mysql', 'mariadb' => "DATE_FORMAT({$colonne}, '%Y-%m')",
            'sqlite' => "strftime('%Y-%m', {$colonne})",
            'pgsql' => "to_char({$colonne}, 'YYYY-MM')",
        };
    }

    private static function pilote(?string $pilote): string
    {
        $pilote ??= DB::getDriverName();

        if (! in_array($pilote, self::PILOTES, true)) {
            throw new InvalidArgumentException("Pilote SQL non pris en charge pour les dates : {$pilote}");
        }

        return $pilote;
    }
}
