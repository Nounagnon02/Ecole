<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Give a university student — and a university lecturer — a login account.
 *
 * `etudiants` carried no `user_id`. Every scholastic profile has one
 * (`eleves.user_id`, `parents.user_id`, `enseignants.user_id`, and
 * `User::eleve()`/`parent()`/`enseignant()` read them), so the whole personal
 * side of the app rests on that link. The university module simply did not have
 * it: a signed-in account could not be resolved to a student, which makes
 * *every* "my …" view of the module impossible — my courses, my marks, my
 * timetable, my assignments. It is the prerequisite for all of them, not one
 * missing feature among others.
 *
 * `uni_enseignants` has the same hole and it is the same defect: the courses
 * page serves a lecturer as well as a student, and without the link the server
 * cannot tell which lecturer is asking either.
 *
 * ## Nullable, and why
 *
 * A student record may legitimately exist before an account is issued —
 * enrolment happens at the registrar's desk, credentials come later. Requiring
 * the column would make the registrar's own workflow impossible.
 *
 * ## Unique platform-wide, not per school
 *
 * `2026_08_03_120000_scope_unique_identifiers_per_school` rescoped identifiers
 * a school *assigns for itself* (`etudiants.matricule` among them) to
 * `(ecole_id, column)`. `user_id` is not such an identifier: it points at a
 * login identity, and the same reasoning that kept `users.email` platform-wide
 * applies here. One account must resolve to at most one student, or
 * `User::etudiant()` becomes ambiguous and the "my courses" answer depends on
 * row order. A NULL is not constrained by a UNIQUE index on either MySQL or
 * SQLite, so unassigned profiles are unaffected.
 *
 * ## `nullOnDelete`, not cascade
 *
 * Deleting a login account must not erase an academic record — marks,
 * enrolments and diplomas outlive the credential. The row is unlinked instead.
 */
return new class extends Migration
{
    /** table => column the foreign key sits after. */
    private array $tables = [
        'etudiants'        => 'matricule',
        'uni_enseignants'  => 'prenom',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table => $after) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'user_id')) {
                continue;
            }

            // Column, constraint and index in separate calls: SQLite rebuilds
            // the table to honour a foreign key, and mixing the three in one
            // Blueprint makes the outcome driver-dependent. On SQLite
            // `compileForeign` is a no-op for an ALTER, so the constraint is
            // simply absent there — the column and its index are what the
            // scope and the relation need.
            Schema::table($table, function (Blueprint $blueprint) use ($after) {
                $blueprint->foreignId('user_id')->nullable()->after($after);
            });

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('user_id')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->unique('user_id', $table . '_user_id_unique');
            });
        }
    }

    public function down(): void
    {
        foreach (array_keys($this->tables) as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'user_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropUnique($table . '_user_id_unique');
            });

            if (Schema::getConnection()->getDriverName() !== 'sqlite') {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropForeign(['user_id']);
                });
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropColumn('user_id');
            });
        }
    }
};
