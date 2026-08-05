<?php

namespace App\Support;

use App\Models\Ecole;

/**
 * Establish a school for code that runs outside an HTTP request.
 *
 * `BelongsToEcole` resolves the tenant from `auth()->user()?->ecole_id` or the
 * session. A seeder, an Artisan command and a queued job have neither, and the
 * consequences were silent in both directions:
 *
 *   - on write, `ecole_id` stayed null, so the row belonged to no school and was
 *     invisible to everyone, forever. `UniversiteSeeder` produced 12 students,
 *     13 courses of study, 20 subjects, 76 marks and 18 payments this way —
 *     `Etudiant::count()` answered 0 for the head of the very school that owned
 *     them;
 *   - on read, the scope falls back to `whereRaw('1 = 0')`, so a job querying a
 *     scoped table got an empty set and did its work on nothing. Four of the
 *     five jobs in `app/Jobs` never mention a school.
 *
 * Neither produced an error. That is what made it worth a mechanism rather than
 * a `['ecole_id' => $id]` on every call: the omission cannot be noticed.
 *
 * ## Precedence, and why it is not negotiable
 *
 * An authenticated user's own school always wins. If an explicit binding could
 * override it, any code path that sets a context — a job handler, a command, a
 * future middleware — would become a way to read another establishment's data
 * while signed in as someone who may not. The binding fills a gap; it never
 * overrides an identity.
 */
final class SchoolContext
{
    /**
     * Kept in the container, not a static: rebuilt per request and per test, so
     * a binding cannot outlive the work that set it. The same reasoning as
     * `CycleAccess` — a leaked tenant is worse than a recomputed one.
     */
    private const KEY = 'school.context';

    private static function state(): object
    {
        if (!app()->bound(self::KEY)) {
            app()->instance(self::KEY, new class {
                public ?int $schoolId = null;
            });
        }

        return app(self::KEY);
    }

    /**
     * Run a callback with a school bound, then restore whatever was bound
     * before.
     *
     * Restoring rather than clearing means nesting works: a command that binds
     * school A and calls a service that binds school B leaves A in place when B
     * returns. Clearing would silently orphan everything the outer scope wrote
     * afterwards.
     *
     * @template T
     * @param  \Closure(): T  $callback
     * @return T
     */
    public static function for(int|Ecole $school, callable $callback): mixed
    {
        $state    = self::state();
        $previous = $state->schoolId;

        $state->schoolId = $school instanceof Ecole ? $school->id : $school;

        try {
            return $callback();
        } finally {
            $state->schoolId = $previous;
        }
    }

    /**
     * Bind a school for the rest of the process.
     *
     * For a queued job, whose `handle()` has no natural closure to wrap. Prefer
     * `for()` wherever the scope of the work is expressible.
     */
    public static function bind(int|Ecole|null $school): void
    {
        self::state()->schoolId = $school instanceof Ecole ? $school->id : $school;
    }

    /** The bound school, or null when none is. */
    public static function current(): ?int
    {
        return self::state()->schoolId;
    }

    /** Is a school bound? */
    public static function isBound(): bool
    {
        return self::current() !== null;
    }

    public static function forget(): void
    {
        if (app()->bound(self::KEY)) {
            app()->forgetInstance(self::KEY);
        }
    }
}
