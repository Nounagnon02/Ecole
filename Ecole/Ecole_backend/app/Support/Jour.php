<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Une date sans heure (jour calendaire de l'école).
 *
 * Elle reste une date Carbon pour les comparaisons et les calculs, mais sort
 * en JSON sous la forme « 2026-11-16 ». Une date seule sérialisée en ISO
 * valait minuit de Porto-Novo en UTC, « 2026-11-15T23:00:00.000000Z » : la
 * veille pour tout client qui lit les dix premiers caractères (R-32).
 */
class Jour extends Carbon
{
    public function jsonSerialize(): mixed
    {
        return $this->format('Y-m-d');
    }
}
