<?php

namespace App\Support;

/**
 * Numéros de téléphone béninois.
 *
 * Depuis fin novembre 2024, les numéros comptent 10 chiffres et commencent par
 * 01 ; les anciens numéros à 8 chiffres se convertissent en les faisant
 * précéder de 01. `SmsService` ne connaissait que l'ancien format : un numéro
 * saisi comme il s'écrit aujourd'hui était rejeté et aucun SMS ne partait.
 *
 * Une seule définition du format, ici, plutôt qu'une expression régulière par
 * formulaire.
 */
final class BeninPhone
{
    public const COUNTRY_CODE = '229';

    /** Préfixe obligatoire des numéros à 10 chiffres. */
    public const PREFIX = '01';

    /**
     * Forme internationale (`+22901XXXXXXXX`), ou null si la saisie n'est pas
     * un numéro béninois. Les anciens numéros à 8 chiffres sont convertis.
     */
    public static function normalize(?string $raw): ?string
    {
        $digits = preg_replace('/[\s.\-()]/', '', (string) $raw);

        if ($digits === '' || ! preg_match('/^(\+|00)?\d+$/', $digits)) {
            return null;
        }

        $hasInternationalMark = str_starts_with($digits, '+') || str_starts_with($digits, '00');
        $digits = preg_replace('/^(\+|00)/', '', $digits);

        // Avec indicatif : 229 + 10 chiffres (13) ou 229 + 8 chiffres (11).
        // Sans marque internationale, on n'ôte l'indicatif que si la longueur
        // correspond : un numéro local ne commence jamais par 229 à ces tailles.
        if (str_starts_with($digits, self::COUNTRY_CODE) && in_array(strlen($digits), [11, 13], true)) {
            $digits = substr($digits, 3);
        } elseif ($hasInternationalMark) {
            return null; // un autre pays, ou une longueur impossible
        }

        if (strlen($digits) === 8) {
            $digits = self::PREFIX.$digits;
        }

        if (strlen($digits) !== 10 || ! str_starts_with($digits, self::PREFIX)) {
            return null;
        }

        return '+'.self::COUNTRY_CODE.$digits;
    }

    public static function isValid(?string $raw): bool
    {
        return self::normalize($raw) !== null;
    }
}
