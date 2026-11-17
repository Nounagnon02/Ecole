<?php

namespace App\Support;

use App\Models\PaiementEleve;
use Illuminate\Support\Str;

/**
 * Vocabulaire du règlement : modes acceptés, statuts, références.
 *
 * Ces règles vivaient en constante privée et en méthodes privées de
 * `ComptableController`, donc invisibles pour les autres surfaces qui
 * manipulent les mêmes notions — `PaymentController`, les exports, les
 * bulletins de situation. Une valeur ajoutée aux modes de règlement devait
 * être retrouvée à la main, et un libellé de statut pouvait diverger d'un
 * écran à l'autre sans que rien ne le signale (cf. audit P4.4).
 *
 * Classe de vocabulaire, sans état : elle décrit le domaine, elle ne le
 * manipule pas.
 */
final class Reglement
{
    /** Modes de règlement acceptés à la saisie. */
    public const MODES = ['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE', 'CARTE'];

    /** Règle de validation prête à l'emploi. */
    public static function regleMode(): string
    {
        return 'required|in:' . implode(',', self::MODES);
    }

    /**
     * Statut d'échéance en slug, pour le front.
     *
     * La table porte les constantes du modèle depuis la migration de
     * normalisation : l'ancien repli d'accents (`'payé'` → `PAYE`) n'a plus
     * de raison d'être.
     */
    public static function slug(?string $statutGlobal): string
    {
        return match ($statutGlobal) {
            PaiementEleve::PAID    => 'payee',
            PaiementEleve::PARTIAL => 'partiel',
            default                => 'en_attente',
        };
    }

    /** Le même statut, en toutes lettres. */
    public static function libelle(?string $statutGlobal): string
    {
        return match ($statutGlobal) {
            PaiementEleve::PAID    => 'Payée',
            PaiementEleve::PARTIAL => 'Partielle',
            default                => 'En attente',
        };
    }

    /**
     * Référence d'encaissement.
     *
     * Datée puis aléatoire : lisible par un comptable qui cherche un reçu du
     * jour, et sans collision entre établissements — les références émises
     * par une école ont été sorties de l'unicité plateforme.
     */
    public static function nouvelleReference(): string
    {
        return 'PAY-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    }
}
