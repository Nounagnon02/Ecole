<?php

namespace App\Support;

use App\Models\Classes;
use Illuminate\Database\Eloquent\Builder;

/**
 * The cycle boundary: which classes the caller may act on.
 *
 * A school runs three cycles — Maternelle, Primaire, Secondaire — and each has
 * its own head, provisioned as `directeurM`, `directeurP`, `directeurS`. Until
 * now that authority existed only as a label: the three roles were granted the
 * same access as the general head, and the separation rested entirely on each
 * cycle dashboard choosing to call its own endpoints. Nothing stopped the
 * primary head from reading the secondary's records.
 *
 * The cycle is a property of a *class*. Every entity that can belong to a cycle
 * reaches one: directly through a class key, or through the pupil who sits in
 * that class. So the boundary is expressible as one set — the classes of my
 * cycle — resolved once per request and reused by every query.
 *
 * ## Restriction is the exception, not the rule
 *
 * `null` means *no restriction*, and that is the answer for almost everyone:
 * the general head, teachers, pupils, parents, the bursar, the platform
 * super-admin. This is the opposite convention from `BelongsToEcole`, which
 * fails closed when it cannot determine a school — and deliberately so. A
 * school is always knowable for a signed-in user, so a missing one signals a
 * problem and denying is right. A cycle is knowable only for three roles, so
 * denying by default would lock out everybody else.
 *
 * That asymmetry is load-bearing. It is also why `ScopedToCycle` refuses to
 * apply itself to a model that has not declared how it reaches a class: a
 * boundary that silently fails open must fail loudly at development time
 * instead.
 */
final class CycleAccess
{
    /**
     * Where the resolved boundary is kept.
     *
     * The container, not a static property. The container is rebuilt for every
     * HTTP request and for every test, so nothing can survive into the next
     * caller — which a static could, and did: the boundary resolved in one test
     * leaked into the next one and made it fail, while passing in isolation.
     *
     * A wrapper object rather than two raw container entries, because `null` is
     * a meaningful answer here and `Container::bound()` cannot represent it —
     * `instance($key, null)` leaves `bound()` returning false, so "resolved to
     * unrestricted" would be indistinguishable from "not resolved yet" and get
     * recomputed on every query.
     */
    private const STATE = 'cycle.boundary.state';

    private static function state(): object
    {
        if (!app()->bound(self::STATE)) {
            app()->instance(self::STATE, new class {
                public bool $cycleResolved = false;
                public ?string $cycle = null;
                public bool $classIdsResolved = false;
                public ?array $classIds = null;
            });
        }

        return app(self::STATE);
    }

    /**
     * The cycle the caller is confined to, or null when they span the school.
     */
    public static function cycle(): ?string
    {
        $state = self::state();

        if ($state->cycleResolved) {
            return $state->cycle;
        }

        $state->cycle = Roles::cycleOf(auth()->user()?->role);
        $state->cycleResolved = true;

        return $state->cycle;
    }

    /** Is the caller confined to one cycle? */
    public static function isRestricted(): bool
    {
        return self::cycle() !== null;
    }

    /**
     * The ids of the classes inside the caller's cycle, or null when
     * unrestricted.
     *
     * Read through `Classes::query()` rather than a raw subquery, so the
     * `BelongsToEcole` scope applies by construction. Building the subquery by
     * hand would mean remembering to add `ecole_id` — and forgetting it is
     * exactly how the cross-school leaks in `NotesController` happened.
     *
     * @return array<int>|null
     */
    public static function classIds(): ?array
    {
        $state = self::state();

        if ($state->classIdsResolved) {
            return $state->classIds;
        }

        $cycle = self::cycle();

        $state->classIds = $cycle === null
            ? null
            : Classes::query()->where('categorie_classe', $cycle)->pluck('id')->all();

        $state->classIdsResolved = true;

        return $state->classIds;
    }

    /**
     * Does the caller's cycle contain this class?
     *
     * True when unrestricted — the question only constrains a cycle head.
     */
    public static function allowsClass(?int $classId): bool
    {
        $allowed = self::classIds();

        if ($allowed === null) {
            return true;
        }

        return $classId !== null && in_array((int) $classId, $allowed, true);
    }

    /**
     * A pupil-id subquery bounded by the cycle, for tables that reach a class
     * only through their pupil.
     *
     * Returns an Eloquent builder so `whereIn` compiles it into a subquery with
     * the tenant scope already applied — no id list travels through PHP.
     */
    public static function pupilSubquery(): Builder
    {
        return \App\Models\Eleve::query()
            ->select('eleves.id')
            ->whereIn('eleves.classe_id', self::classIds() ?? []);
    }

    /**
     * Forget the resolved boundary.
     *
     * The container already isolates one request or test from the next. This
     * covers the identity changing *inside* one of them: `actingAs` between two
     * assertions, a queued job handling several tenants in a loop. Without it
     * the second caller would inherit the first one's cycle — a cross-user leak
     * created by the cache itself.
     */
    public static function flush(): void
    {
        if (app()->bound(self::STATE)) {
            app()->forgetInstance(self::STATE);
        }
    }
}
