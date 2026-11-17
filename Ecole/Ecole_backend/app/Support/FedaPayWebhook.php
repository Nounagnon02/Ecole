<?php

namespace App\Support;

/**
 * Lecture d'un webhook FedaPay : signature et transaction concernée.
 *
 * Le contrôleur comparait l'en-tête à un simple HMAC du corps et cherchait la
 * transaction dans `entity.transaction`. FedaPay signe « horodatage.corps »,
 * envoie `t=<horodatage>,s=<signature>`, et place la transaction directement
 * dans `entity` : aucun avis réel n'était donc ni accepté, ni compris.
 */
final class FedaPayWebhook
{
    /** Au-delà, un avis intercepté ne peut plus être rejoué. */
    public const TOLERANCE_SECONDS = 300;

    public static function signatureValide(string $corps, ?string $entete, ?string $secret): bool
    {
        if (! is_string($entete) || $entete === '' || ! is_string($secret) || $secret === '') {
            return false;
        }

        $horodatage = null;
        $signatures = [];

        foreach (explode(',', $entete) as $element) {
            [$cle, $valeur] = array_pad(explode('=', trim($element), 2), 2, null);

            if ($cle === 't') {
                $horodatage = $valeur;
            } elseif ($cle === 's' && $valeur !== null) {
                $signatures[] = $valeur;
            }
        }

        if (! is_string($horodatage) || ! ctype_digit($horodatage) || $signatures === []) {
            return false;
        }

        if (abs(time() - (int) $horodatage) > self::TOLERANCE_SECONDS) {
            return false;
        }

        $attendue = hash_hmac('sha256', $horodatage.'.'.$corps, $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($attendue, $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Identifiant et statut de la transaction visée, ou null si l'événement
     * n'en concerne pas une.
     *
     * @return array{id: string, status: string}|null
     */
    public static function transaction(array $evenement): ?array
    {
        $entite = $evenement['entity'] ?? null;

        if (is_string($entite)) {
            $entite = json_decode($entite, true);
        }

        if (! is_array($entite)) {
            return null;
        }

        // Ancienne forme, encore produite par nos propres tests et outils.
        if (isset($entite['transaction']) && is_array($entite['transaction'])) {
            $entite = $entite['transaction'];
        } elseif (($evenement['object'] ?? null) !== 'transaction'
            && ! str_starts_with((string) ($evenement['name'] ?? ''), 'transaction.')) {
            return null;
        }

        if (! isset($entite['id'], $entite['status'])) {
            return null;
        }

        return ['id' => (string) $entite['id'], 'status' => (string) $entite['status']];
    }
}
