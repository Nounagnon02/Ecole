<?php

use App\Support\Cycles;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Bring `classes.categorie_classe` to a single casing.
 *
 * The column was written as `Maternelle`/`Primaire`/`Secondaire` by
 * `ClassesController` and the seeders, but queried as
 * `maternelle`/`primaire`/`secondaire` by `NotesController`,
 * `typeEvaluationController` and `periodesController`. On MySQL the default
 * collation is case-insensitive, so the mismatch stayed invisible; the same
 * queries return nothing on SQLite.
 *
 * Readers now use `Cycles::*`, which is the capitalised form. Existing rows
 * written in lower case would stop matching, so they are normalised here.
 *
 * `enseignant_matiere` carries a `categorie_classe` pivot column with the same
 * problem, so it gets the same treatment.
 */
return new class extends Migration
{
    /** Tables holding a cycle name that readers compare against. */
    private array $tables = ['classes', 'enseignant_matiere'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'categorie_classe')) {
                continue;
            }

            foreach (Cycles::all() as $canonical) {
                // Compare in lower case on both sides so the update is
                // independent of the connection's collation — the whole point
                // of this migration is not to rely on it.
                DB::table($table)
                    ->whereRaw('LOWER(TRIM(categorie_classe)) = ?', [mb_strtolower($canonical)])
                    ->where('categorie_classe', '!=', $canonical)
                    ->update(['categorie_classe' => $canonical]);
            }
        }
    }

    /**
     * Nothing to undo: the previous state was two casings mixed arbitrarily,
     * and restoring that would only reintroduce the defect.
     */
    public function down(): void
    {
    }
};
