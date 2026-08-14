<?php

namespace App\Support;

use DateTimeInterface;

/**
 * Année scolaire béninoise, au format « 2026-2027 ».
 *
 * Le calendrier scolaire national démarre en septembre : une date du mois de
 * septembre (ou après) appartient à l'année qui commence, toute date antérieure
 * (janvier à août) appartient à l'année qui vient de se terminer.
 */
final class AnneeScolaire
{
    public static function courante(?DateTimeInterface $date = null): string
    {
        $date ??= now();
        $year = (int) $date->format('Y');
        $month = (int) $date->format('n');

        return $month >= 9
            ? $year.'-'.($year + 1)
            : ($year - 1).'-'.$year;
    }
}
