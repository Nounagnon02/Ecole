<?php

namespace App\Validation;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * `school_exists:table,column` — existence, bounded by the caller's school.
 *
 * Laravel's `exists:` rule runs on the raw query builder, so it never sees the
 * `BelongsToEcole` global scope. Around 110 rules across 27 files therefore
 * accepted any id from any establishment on the platform. Validation passing is
 * the whole problem: the write then went through with a foreign key pointing at
 * another tenant's row.
 *
 * The accountant's payment endpoint is the clearest case — `exists:eleves,id`
 * let one school record a payment against another school's pupil.
 *
 * ## Why a new rule rather than replacing `exists`
 *
 * Overriding the built-in would cover every call site with no edits, but
 * `exists` carries a lot of behaviour — additional wheres, array values, the
 * `Rule::exists()` object form, null handling. Reimplementing all of it to add
 * one clause is a poor trade. A separate rule keeps the built-in intact and
 * makes the scoped intent visible at each call site.
 *
 * ## Tables without a school
 *
 * The `ecole_id` constraint is added only when the column exists, so the same
 * rule is safe on platform-level tables (`tenants`, `plans`, `modules`). That
 * check is made per call rather than from a hardcoded list, so a table gaining
 * `ecole_id` later is covered without anyone remembering to update this file.
 */
final class SchoolExistsRule
{
    public const NAME = 'school_exists';

    public static function register(): void
    {
        Validator::extend(
            self::NAME,
            fn($attribute, $value, $parameters) => self::passes($value, $parameters),
            'Le champ :attribute ne correspond à aucun enregistrement de cet établissement.'
        );
    }

    /**
     * @param  array<int, string>  $parameters  [table, column?]
     */
    private static function passes($value, array $parameters): bool
    {
        if ($value === null || $value === '') {
            // Absence is `required`'s business, not existence's — matching how
            // the built-in `exists` behaves.
            return true;
        }

        $table  = $parameters[0] ?? null;
        $column = $parameters[1] ?? 'id';

        if ($table === null || !Schema::hasTable($table)) {
            return false;
        }

        $query = DB::table($table)->where($column, $value);

        if (Schema::hasColumn($table, 'ecole_id')) {
            $schoolId = auth()->user()?->ecole_id ?? session('ecole_id');

            // A platform super-admin has no school of their own and may act
            // across establishments; anyone else with no resolvable school gets
            // nothing, which is how `BelongsToEcole` behaves too.
            if (auth()->user()?->role !== \App\Support\Roles::SUPER_ADMIN) {
                if (!$schoolId) {
                    return false;
                }

                $query->where('ecole_id', $schoolId);
            } elseif ($schoolId) {
                $query->where('ecole_id', $schoolId);
            }
        }

        return $query->exists();
    }
}
