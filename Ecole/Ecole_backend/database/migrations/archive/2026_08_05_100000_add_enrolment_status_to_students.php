<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Give pupils and university students a way to leave without being erased.
 *
 * `EleveController::destroy` ran `$eleve->delete()` followed by
 * `$user->delete()`. Both were hard deletes, and 18 tables cascaded on
 * `eleves.id`: one call to that endpoint erased a pupil's marks, absences,
 * payments, averages, medical file, vaccinations, library loans, scholarships,
 * certificates, appointments and exam registrations — plus their account. Four
 * more tables did the same for `etudiants`.
 *
 * That is the `ecole_id` defect one level down, and it gets the same answer,
 * because the answer was already the right one: a record is deactivated, never
 * deleted (see `2026_08_03_100000_restrict_school_deletion`).
 *
 * Two mechanisms, as for `ecoles`, and they are not redundant:
 *
 *   - `statut` is the enrolment state. An inactive pupil is still listed, still
 *     searchable, and their file still opens — they are simply no longer
 *     enrolled. This is what the API's delete now does.
 *   - `deleted_at` is archival. A soft-deleted pupil drops out of every query,
 *     which is right for a record created in error and wrong for one that just
 *     ended. Keeping both means "left the school" and "should never have been
 *     here" stay distinguishable.
 *
 * The vocabulary is `active` / `inactive`, matching `ecoles.status`. Richer
 * reasons for leaving — transferred, graduated, withdrawn — are a product
 * question nobody has asked yet, and inventing an enum now would freeze an
 * answer without a question.
 */
return new class extends Migration
{
    /** table => the column that already holds the school key, for `after()`. */
    private array $tables = [
        'eleves'    => 'ecole_id',
        'etudiants' => 'ecole_id',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table => $anchor) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $anchor) {
                if (!Schema::hasColumn($table, 'statut')) {
                    $column = $blueprint->string('statut')->default('active');

                    if (Schema::hasColumn($table, $anchor)) {
                        $column->after($anchor);
                    }

                    // Every list view filters on it, so it earns an index.
                    $blueprint->index('statut');
                }

                if (!Schema::hasColumn($table, 'deleted_at')) {
                    $blueprint->softDeletes();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (array_keys($this->tables) as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (Schema::hasColumn($table, 'statut')) {
                    $blueprint->dropIndex(['statut']);
                    $blueprint->dropColumn('statut');
                }

                if (Schema::hasColumn($table, 'deleted_at')) {
                    $blueprint->dropSoftDeletes();
                }
            });
        }
    }
};
