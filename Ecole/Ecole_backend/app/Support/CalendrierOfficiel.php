<?php

namespace App\Support;

use DateTimeInterface;
use DateTimeImmutable;

/**
 * Calendrier scolaire officiel de la République du Bénin.
 *
 * Un jour de classe est un jour de semaine (lundi → vendredi) qui n'est pas
 * un jour férié légal. Les fêtes à date fixe sont connues, les fêtes mobiles
 * sont calculées : Pâques et ses dérivés (Lundi de Pâques, Ascension, Lundi
 * de Pentecôte) via `easter_days()`, et les fêtes islamiques (Aïd el-Fitr,
 * Tabaski, Maouloud) via le calendrier islamique tabulaire — qui se cale sur
 * les dates observées à ±1 jour près.
 *
 * Les samedis/dimanches ne sont pas comptés : ajuster `JOURS_SCOLAIRES` si un
 * établissement ouvre le samedi matin.
 */
final class CalendrierOfficiel
{
    /** Jours de classe : `N` = 1 (Lundi) … 7 (Dimanche). */
    private const JOURS_SCOLAIRES = [1, 2, 3, 4, 5];

    /** Jours fériés légaux à date fixe, au format [mois, jour]. */
    private const FERIES_FIXES = [
        [1, 1],    // Jour de l'an
        [5, 1],    // Fête du Travail
        [8, 1],    // Fête de l'Indépendance (Fête nationale)
        [8, 15],   // Assomption
        [11, 1],   // Toussaint
        [12, 25],  // Noël
    ];

    /** Fêtes islamiques au format [mois, jour] du calendrier hégirien. */
    private const FERIES_ISLAMIQUES = [
        [3, 12],   // Maouloud (naissance du Prophète)
        [10, 1],   // Aïd el-Fitr (fin du Ramadan)
        [12, 10],  // Tabaski (Aïd el-Adha)
    ];

    /** Nombre de jours après Pâques pour chaque fête chrétienne mobile. */
    private const FERIES_PAQUES = [
        1  => 'Lundi de Pâques',
        39 => 'Ascension',
        50 => 'Lundi de Pentecôte',
    ];

    public static function estJourClasse(DateTimeInterface $date): bool
    {
        return in_array((int) $date->format('N'), self::JOURS_SCOLAIRES, true)
            && !self::estJourFerie($date);
    }

    public static function estJourFerie(DateTimeInterface $date): bool
    {
        return in_array($date->format('m-d'), self::feriesDeAnnee((int) $date->format('Y')), true);
    }

    public static function joursScolairesDuMois(int $year, int $month): int
    {
        // L'année scolaire béninoise court de septembre à juin : juillet et
        // août sont les grandes vacances, aucun jour de classe n'y est compté.
        if (in_array($month, [7, 8], true)) {
            return 0;
        }

        $mois = sprintf('%04d-%02d', $year, $month);
        $total = (int) (new DateTimeImmutable($mois.'-01'))->format('t');
        $jours = 0;

        for ($day = 1; $day <= $total; $day++) {
            if (self::estJourClasse(new DateTimeImmutable(sprintf('%s-%02d', $mois, $day)))) {
                $jours++;
            }
        }

        return $jours;
    }

    /** Tous les jours fériés d'une année grégorienne, au format « m-d ». */
    private static function feriesDeAnnee(int $year): array
    {
        $dates = [];

        foreach (self::FERIES_FIXES as [$mois, $jour]) {
            $dates[] = sprintf('%02d-%02d', $mois, $jour);
        }

        $paques = (new DateTimeImmutable(sprintf('%04d-03-21T12:00:00', $year)))
            ->modify('+'.easter_days($year).' days');
        foreach (self::FERIES_PAQUES as $delta => $nom) {
            $dates[] = $paques->modify("+{$delta} days")->format('m-d');
        }

        foreach (self::feriesMobilesIslamiques($year) as $date) {
            $dates[] = $date;
        }

        return array_values(array_unique($dates));
    }

    /**
     * Fêtes islamiques tombant dans une année grégorienne donnée.
     *
     * Le calendrier hégirien étant ~11 jours plus court que l'année solaire,
     * deux années islamiques peuvent se chevaucher dans une même année
     * grégorienne : on balaye les années hégiriennes voisines de
     * « (année - 621,57) × 1,030689 » et on conserve celles qui y tombent.
     */
    private static function feriesMobilesIslamiques(int $year): array
    {
        $base = (int) floor(($year - 621.569) * 1.030689);
        $dates = [];

        foreach (range($base - 1, $base + 1) as $anHegirien) {
            foreach (self::FERIES_ISLAMIQUES as [$mois, $jour]) {
                [$gregY, $gregM, $gregD] = self::islamiqueVersGregorien($anHegirien, $mois, $jour);
                if ($gregY === $year) {
                    $dates[] = sprintf('%02d-%02d', $gregM, $gregD);
                }
            }
        }

        return $dates;
    }

    /**
     * Conversion d'une date du calendrier islamique tabulaire vers le
     * calendrier grégorien (retourne [année, mois, jour] grégoriens).
     */
    private static function islamiqueVersGregorien(int $an, int $mois, int $jour): array
    {
        $jd = intdiv(11 * $an + 3, 30) + 354 * $an + 30 * $mois
            - intdiv($mois - 1, 2) + $jour + 1948440 - 385;

        $l = $jd + 68569;
        $n = intdiv(4 * $l, 146097);
        $l -= intdiv(146097 * $n + 3, 4);
        $i = intdiv(4000 * ($l + 1), 1461001);
        $l = $l - intdiv(1461 * $i, 4) + 31;
        $j = intdiv(80 * $l, 2447);
        $day = $l - intdiv(2447 * $j, 80);
        $l = intdiv($j, 11);
        $month = $j + 2 - 12 * $l;
        $year = 100 * ($n - 49) + $i + $l;

        return [$year, $month, $day];
    }
}
