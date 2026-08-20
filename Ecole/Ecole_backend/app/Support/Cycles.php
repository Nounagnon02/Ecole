<?php

namespace App\Support;

/**
 * The school cycle vocabulary, in one place.
 *
 * `classes.categorie_classe` is a free-text column written in two different
 * casings across the codebase: `ClassesController` and the seeders store
 * `Maternelle`/`Primaire`/`Secondaire`, while `NotesController`,
 * `TypeEvaluationController` and `PeriodesController` query for
 * `maternelle`/`primaire`/`secondaire`. That survived only because MySQL's
 * default collation is case-insensitive — the same queries return nothing on
 * SQLite, which is what the test suite runs on.
 *
 * PHP is not so forgiving. `EleveController::bulletin` compared
 * `$classe->categorie_classe === 'secondaire'` against a stored `Secondaire`:
 * always false, so **every secondary pupil was served the kindergarten/primary
 * report card** — a different computation with different periods and no
 * coefficients.
 *
 * The canonical stored form is capitalised, matching the `in:` rule the write
 * path already validates against.
 */
final class Cycles
{
    public const KINDERGARTEN = 'Maternelle';
    public const PRIMARY      = 'Primaire';
    public const SECONDARY    = 'Secondaire';

    /** Every cycle, in school order. */
    public static function all(): array
    {
        return [self::KINDERGARTEN, self::PRIMARY, self::SECONDARY];
    }

    /** The validation rule for the column, so the two cannot drift apart. */
    public static function rule(): string
    {
        return 'in:' . implode(',', self::all());
    }

    /**
     * Bring any casing back to the canonical form, or null if unrecognised.
     *
     * Returning null rather than guessing matters: a caller that cannot tell
     * the cycle should fall through to its default branch deliberately, not on
     * a silent mismatch.
     */
    public static function normalise(?string $cycle): ?string
    {
        if ($cycle === null) {
            return null;
        }

        foreach (self::all() as $canonical) {
            if (strcasecmp(trim($cycle), $canonical) === 0) {
                return $canonical;
            }
        }

        return null;
    }

    /** Do these two values name the same cycle, whatever their casing? */
    public static function is(?string $cycle, string $expected): bool
    {
        return self::normalise($cycle) === self::normalise($expected);
    }
}
