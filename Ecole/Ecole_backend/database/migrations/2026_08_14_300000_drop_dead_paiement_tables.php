<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Suppression des tables mortes du domaine paiements.
 *
 * `2024_01_05_000002_paiements.php` créait, autour de `paiements`, treize
 * tables d'échafaudage (`paiement_details`, `paiement_status`,
 * `paiement_retries`, `paiement_notifications`, `paiement_logs`,
 * `paiement_audits`, `paiement_refunds`, `paiement_disputes`,
 * `paiement_invoices`, `paiement_receipts`, `paiement_schedules`,
 * `paiement_methods`, `paiement_method_details`) qu'aucun modèle, contrôleur,
 * seeder, service, route ni test ne lit ou n'écrit. Seuls les migrations
 * historiques et le garde-fou de suppression d'école les mentionnent — tous
 * deux défensifs (`hasTable`/`hasColumn`), donc insensibles à leur absence.
 *
 * La contrainte réelle vit sur `paiements` lui-même ; la vérité comptable
 * détaillée vit sur `transaction_paiements` (règlements réalisés) et le plan
 * de tranches sur `statut_tranches`. Ces tables ne portaient aucune donnée.
 *
 * Non réversible : recréer treize colonnes mortes n'apporterait rien et
 * casserait l'unicité par école des identifiants (`paiement_methods`).
 */
return new class extends Migration
{
    private array $tables = [
        'paiement_details',
        'paiement_status',
        'paiement_retries',
        'paiement_notifications',
        'paiement_logs',
        'paiement_audits',
        'paiement_refunds',
        'paiement_disputes',
        'paiement_invoices',
        'paiement_receipts',
        'paiement_schedules',
        'paiement_method_details',
        'paiement_methods',
    ];

    public function up(): void
    {
        // Désactive les vérifications de clés étrangères : `paiement_method_details`
        // référence `paiement_methods`, et les douze autres référencent
        // `paiements` (conservée) — l'ordre de drop ne doit dépendre d'aucun moteur.
        Schema::disableForeignKeyConstraints();

        try {
            foreach ($this->tables as $table) {
                if (Schema::hasTable($table)) {
                    Schema::dropIfExists($table);
                }
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public function down(): void
    {
        // Volontairement non réversible : cf. doc de classe.
    }
};
