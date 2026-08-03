<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make school-issued identifiers unique per school, not per platform.
 *
 * Seven columns on tenant-scoped tables carried a platform-wide UNIQUE index on
 * a value each school assigns for itself. Two of them blocked onboarding
 * outright:
 *
 *   - `type_evaluations.nom` — only one school on the whole platform could have
 *     an evaluation type named `Devoir1`;
 *   - `paiement_methods.method_name` — only one could offer `Mobile Money`.
 *
 * The others are silent until a collision: two schools numbering their pupils
 * from `MAT-001` cannot both register pupil number one, and the second school's
 * enrolment fails with a constraint violation it cannot act on.
 *
 * Deliberately left platform-wide:
 *
 *   - `users.email`, `users.identifiant` and `utilisateurs.nom_utilisateur` —
 *     these are login identities. One credential must resolve to one account,
 *     or authentication becomes ambiguous.
 *   - `payments.transaction_id` — issued by the payment provider, globally
 *     unique by nature; scoping it would let the same provider transaction be
 *     recorded twice.
 *   - `vehicules.immatriculation` — a registration plate is unique nationally,
 *     so the constraint matches reality.
 */
return new class extends Migration
{
    /** table => column that a school assigns for itself. */
    private array $identifiers = [
        'eleves'            => 'numero_matricule',
        'etudiants'         => 'matricule',
        'certificats'       => 'numero_certificat',
        'paiement_invoices' => 'invoice_number',
        'paiement_receipts' => 'receipt_number',
        'paiement_methods'  => 'method_name',
        'type_evaluations'  => 'nom',
    ];

    public function up(): void
    {
        foreach ($this->identifiers as $table => $column) {
            $this->rescope($table, $column, perSchool: true);
        }
    }

    public function down(): void
    {
        foreach ($this->identifiers as $table => $column) {
            $this->rescope($table, $column, perSchool: false);
        }
    }

    /**
     * Swap the unique index between `(column)` and `(ecole_id, column)`.
     */
    private function rescope(string $table, string $column, bool $perSchool): void
    {
        if (!Schema::hasTable($table)
            || !Schema::hasColumn($table, $column)
            || !Schema::hasColumn($table, 'ecole_id')) {
            return;
        }

        $wanted = $perSchool ? ['ecole_id', $column] : [$column];
        $stale  = $perSchool ? [$column] : ['ecole_id', $column];

        foreach (Schema::getIndexes($table) as $index) {
            if (!($index['unique'] ?? false)) {
                continue;
            }

            if (($index['columns'] ?? []) === $wanted) {
                return; // already in the target shape
            }

            if (($index['columns'] ?? []) === $stale) {
                // Drop by name: an index created with a non-conventional name
                // cannot be dropped by column list. Unlike foreign keys, SQLite
                // is happy to drop an index by name.
                $name = $index['name'];

                Schema::table($table, function (Blueprint $blueprint) use ($name) {
                    $blueprint->dropUnique($name);
                });
            }
        }

        Schema::table($table, function (Blueprint $blueprint) use ($wanted) {
            $blueprint->unique($wanted);
        });
    }
};
