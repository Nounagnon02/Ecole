<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'absences',
        'bourses',
        'certificats',
        'classe_matieres',
        'classe_series',
        'classes',
        'conseils_classe',
        'consultations_medicales',
        'contributions',
        'dossiers_medicaux',
        'eleves',
        'eleves_matieres',
        'eleves_parents',
        'emplois_du_temps',
        'emprunts',
        'enseignant_matiere',
        'enseignantmp_classe',
        'enseignants',
        'enseignants_martenel_primaire',
        'examens',
        'exercices',

        'incidents',
        'livres',
        'matieres',
        'messages',
        'migrations',
        'notes',
        'notifications',
        'paiement_audits',
        'paiement_details',
        'paiement_disputes',
        'paiement_invoices',
        'paiement_logs',
        'paiement_method_details',
        'paiement_methods',
        'paiement_notifications',
        'paiement_receipts',
        'paiement_refunds',
        'paiement_retries',
        'paiement_schedules',
        'paiement_status',
        'paiements',
        'parents',

        'periodes',
        'rendez_vous',
        'reservations',
        'sanctions',
        'serie_matieres',
        'series',
        'type_evaluations',
        'typeevaluation_classes',
        'users',
        'vaccinations',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'ecole_id')) {
                    // nullable d'abord pour éviter le plantage si data existante
                    $table->foreignId('ecole_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('ecoles')
                        ->cascadeOnDelete();

                    $table->index('ecole_id', $tableName . '_ecole_id_index');
                }
            });
        }

        // NOTE: si tu veux rendre NOT NULL après backfill, crée une migration ultérieure:
        // foreach ($this->tables as $tableName) {
        //     Schema::table($tableName, function (Blueprint $table) {
        //         $table->foreignId('ecole_id')->nullable(false)->change();
        //     });
        // }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'ecole_id')) {
                    // Drop FK constraint first (Laravel name convention: {table}_{column}_foreign)
                    $fkName = $tableName . '_ecole_id_foreign';
                    if ($this->hasForeignKey($tableName, $fkName)) {
                        $table->dropForeign($fkName);
                    }

                    // Drop index if exists
                    $indexName = $tableName . '_ecole_id_index';
                    try {
                        $table->dropIndex($indexName);
                    } catch (\Throwable $e) {
                        // ignore if index missing
                    }

                    // Drop column
                    $table->dropColumn('ecole_id');
                }
            });
        }
    }

    /**
     * Helper to detect foreign key by name.
     */
    private function hasForeignKey(string $table, string $fkName): bool
    {
        try {
            $connection = Schema::getConnection()->getDoctrineSchemaManager();
            $doctrineTable = $connection->listTableDetails($table);
            return $doctrineTable->hasForeignKey($fkName);
        } catch (\Throwable $e) {
            // Doctrine may be unavailable; fallback: try drop and catch upstream
            return true;
        }
    }
};
