<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Turn the 22 cascades onto a student record into RESTRICT.
 *
 * The companion to `2026_08_03_100000_restrict_school_deletion`, one level down.
 * 18 tables cascaded on `eleves.id` and 4 on `etudiants.id`, so a single delete
 * erased everything an establishment holds about a person: marks, absences,
 * payments, averages, medical file, vaccinations, library loans, scholarships,
 * certificates, appointments, exam registrations, diplomas, enrolments.
 *
 * A pupil's file is precisely what a school must be able to read back years
 * later — for a certificate, a transcript, a dispute. RESTRICT makes the
 * database refuse rather than comply, so an accidental delete fails loudly.
 * `statut` and `deleted_at` (previous migration) are what one uses instead.
 *
 * ## The `on()` target is read from the schema, not assumed
 *
 * Three of these columns are named `eleves_id`, not `eleve_id`
 * (`eleves_matieres`, `moyennes`, `paiements`) — a plural that survived from an
 * earlier convention. Recreating the constraint with a guessed column name
 * would silently point it at nothing, so each is taken from the live foreign-key
 * definition.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->rewrite('restrict');
    }

    public function down(): void
    {
        $this->rewrite('cascade');
    }

    /**
     * Replace every foreign key targeting a student table with the given rule.
     */
    private function rewrite(string $rule): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            foreach ($this->studentForeignKeys() as $fk) {
                $this->replaceConstraint($fk['table'], $fk['columns'], $fk['on'], $rule);
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    /**
     * Every foreign key pointing at `eleves` or `etudiants`, from the live
     * schema.
     *
     * @return array<int, array{table: string, columns: array<int, string>, on: string}>
     */
    private function studentForeignKeys(): array
    {
        $found = [];

        foreach (Schema::getTables() as $table) {
            foreach (Schema::getForeignKeys($table['name']) as $fk) {
                $target = strtolower((string) ($fk['foreign_table'] ?? ''));

                if (!in_array($target, ['eleves', 'etudiants'], true)) {
                    continue;
                }

                $found[] = [
                    'table'   => $table['name'],
                    'columns' => $fk['columns'] ?? [],
                    'on'      => $target,
                ];
            }
        }

        return $found;
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function replaceConstraint(string $table, array $columns, string $on, string $rule): void
    {
        if ($columns === []) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $on, $rule) {
            // Drop by column, not by name: SQLite rejects the named form
            // outright, while the column form goes through a table rebuild.
            $blueprint->dropForeign($columns);

            $foreign = $blueprint->foreign($columns)->references('id')->on($on);

            $rule === 'cascade' ? $foreign->cascadeOnDelete() : $foreign->restrictOnDelete();
        });
    }
};
