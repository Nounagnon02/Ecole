<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Turn `ecole_id` foreign keys from CASCADE into RESTRICT.
 *
 * 62 tables cascaded on delete, so a single `DELETE FROM ecoles` — or one
 * `forceDelete()` — silently destroyed an entire establishment: pupils, marks,
 * report cards, payments, medical records, everything. There was no undo and no
 * warning.
 *
 * The product rule is now explicit: a school is deactivated, never deleted.
 * RESTRICT enforces that at the database level, so an accidental delete fails
 * loudly instead of erasing data. Deactivation lives on `ecoles.status`, and is
 * enforced at authentication (see AuthController) rather than by removing rows.
 *
 * Note: `ecoles` also uses SoftDeletes, so `delete()` only sets `deleted_at`
 * and never reached the cascade. The exposure was `forceDelete()` and any
 * direct SQL — narrow, but catastrophic when hit.
 */
return new class extends Migration
{
    /**
     * Every table carrying an `ecole_id` foreign key, taken from the live
     * schema rather than from memory.
     */
    private array $tables = [
        'absences', 'bourses', 'certificats', 'classe_matieres', 'classe_series',
        'classes', 'conseils_classe', 'consultations_medicales', 'contributions',
        'depenses', 'devoirs', 'dossiers_medicaux', 'eleves', 'eleves_matieres',
        'eleves_parents', 'emplois_du_temps', 'emprunts', 'enseignant_matiere',
        'enseignantmp_classe', 'enseignants', 'enseignants_martenel_primaire',
        'examens', 'exercices', 'incidents', 'livres', 'matieres', 'messages',
        'moyennes', 'notes', 'notifications', 'paiement_audits',
        'paiement_details', 'paiement_disputes', 'paiement_invoices',
        'paiement_logs', 'paiement_method_details', 'paiement_methods',
        'paiement_notifications', 'paiement_receipts', 'paiement_refunds',
        'paiement_retries', 'paiement_schedules', 'paiement_status', 'paiements',
        'parents', 'payments', 'periodes', 'personnel', 'rendez_vous',
        'reservations', 'sanctions', 'serie_matieres', 'series',
        'sessions_academiques', 'statut_tranches', 'transaction_paiements',
        'type_evaluations', 'typeevaluation_classes', 'uni_paiements', 'users',
        'vaccinations',
    ];

    public function up(): void
    {
        // SQLite rebuilds the table to alter a foreign key, and cannot do that
        // while foreign_keys is on.
        $this->withoutForeignKeyChecks(function () {
            foreach ($this->tables as $table) {
                $this->replaceConstraint($table, 'restrict');
            }

            $this->unscopeMigrationsTable();
        });
    }

    /**
     * Remove `ecole_id` from Laravel's own `migrations` table.
     *
     * An earlier catch-all migration listed `migrations` among the tables to
     * tenant-scope, so the framework's bookkeeping table gained an `ecole_id`
     * column and a cascading foreign key to `ecoles`. It is not business data
     * and must never be scoped to a school.
     */
    private function unscopeMigrationsTable(): void
    {
        if (!Schema::hasTable('migrations') || !Schema::hasColumn('migrations', 'ecole_id')) {
            return;
        }

        if ($this->hasSchoolForeignKey('migrations')) {
            Schema::table('migrations', function (Blueprint $blueprint) {
                $blueprint->dropForeign(['ecole_id']);
            });
        }

        // The index must go first: dropping the column while an index still
        // references it leaves the index dangling and the statement fails.
        foreach (Schema::getIndexes('migrations') as $index) {
            if (in_array('ecole_id', $index['columns'] ?? [], true)) {
                Schema::table('migrations', function (Blueprint $blueprint) use ($index) {
                    $blueprint->dropIndex($index['name']);
                });
            }
        }

        Schema::table('migrations', function (Blueprint $blueprint) {
            $blueprint->dropColumn('ecole_id');
        });
    }

    public function down(): void
    {
        $this->withoutForeignKeyChecks(function () {
            foreach ($this->tables as $table) {
                $this->replaceConstraint($table, 'cascade');
            }
        });
    }

    /**
     * Drop and recreate the `ecole_id` constraint with the given delete rule.
     */
    private function replaceConstraint(string $table, string $rule): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'ecole_id')) {
            return;
        }

        // Only touch tables that actually carry the constraint: dropping one
        // that does not exist fails, and some tables have the column without a
        // foreign key.
        if (!$this->hasSchoolForeignKey($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($rule) {
            // Drop by column, not by name: SQLite rejects the named form
            // outright ("does not support dropping foreign keys by name"),
            // while the column form is handled through a table rebuild. MySQL
            // derives the conventional name from the column, so one call works
            // on both.
            $blueprint->dropForeign(['ecole_id']);

            $fk = $blueprint->foreign('ecole_id')->references('id')->on('ecoles');

            $rule === 'cascade' ? $fk->cascadeOnDelete() : $fk->restrictOnDelete();
        });
    }

    /**
     * Does this table declare a foreign key on `ecole_id`?
     */
    private function hasSchoolForeignKey(string $table): bool
    {
        foreach (Schema::getForeignKeys($table) as $fk) {
            if (in_array('ecole_id', $fk['columns'] ?? [], true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Run a callback with foreign key enforcement suspended.
     */
    private function withoutForeignKeyChecks(callable $callback): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            $callback();
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
};
