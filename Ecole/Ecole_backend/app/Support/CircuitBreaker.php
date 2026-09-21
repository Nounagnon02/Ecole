<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Coupe-circuit générique pour les dépendances externes (FedaPay, l'API
 * Anthropic...). Sans lui, chaque requête pendant une vraie panne du
 * fournisseur attend son plein délai avant d'échouer -- ici, après quelques
 * échecs consécutifs, le circuit s'ouvre et les appels suivants échouent
 * immédiatement, sans même essayer, jusqu'à l'expiration du délai de
 * répit (le TTL du cache fait office de sonde « half-open » : le premier
 * appel après expiration retente normalement).
 *
 * Volontairement basé sur le cache, pas la base de données : l'état d'un
 * coupe-circuit est éphémère par nature, et ne doit jamais dépendre de la
 * disponibilité d'une ressource qu'il est censé protéger contre.
 */
class CircuitBreaker
{
    public static function isOpen(string $service): bool
    {
        return (bool) Cache::get(self::openKey($service), false);
    }

    public static function recordFailure(string $service, int $threshold = 5, int $cooldownSeconds = 60): void
    {
        $failures = (int) Cache::get(self::failuresKey($service), 0) + 1;
        Cache::put(self::failuresKey($service), $failures, $cooldownSeconds);

        if ($failures >= $threshold) {
            Cache::put(self::openKey($service), true, $cooldownSeconds);
        }
    }

    public static function recordSuccess(string $service): void
    {
        Cache::forget(self::failuresKey($service));
        Cache::forget(self::openKey($service));
    }

    private static function failuresKey(string $service): string
    {
        return "circuit-breaker:{$service}:failures";
    }

    private static function openKey(string $service): string
    {
        return "circuit-breaker:{$service}:open";
    }
}
