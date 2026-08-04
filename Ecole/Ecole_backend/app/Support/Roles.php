<?php

namespace App\Support;

/**
 * The role vocabulary, in one place.
 *
 * It used to be spelled out inline in six files with diverging lists, and the
 * divergence had a concrete cost: `SchoolProvision` creates a `directeurM`,
 * `directeurP` and `directeurS` account for every school, but not one route
 * mentioned those roles — all 87 director-gated routes read `role:directeur`.
 * The three cycle heads were provisioned, handed a password, and locked out of
 * the entire API. `DashboardController` and `NotesController` had each grown
 * their own private list to work around it; the policies had not, so a cycle
 * head also failed every policy check.
 *
 * A role now belongs to a *family*. Gating on the head of a family admits its
 * members, so `role:directeur` covers the cycle heads without every route
 * having to enumerate them.
 */
final class Roles
{
    /* ─── Platform ────────────────────────────────────────────────────── */

    /** The one genuinely transverse role. `directeur` is not transverse. */
    public const SUPER_ADMIN = 'super-admin';

    /* ─── Heads of school ─────────────────────────────────────────────── */

    public const DIRECTOR             = 'directeur';
    public const DIRECTOR_KINDERGARTEN = 'directeurM';
    public const DIRECTOR_PRIMARY      = 'directeurP';
    public const DIRECTOR_SECONDARY    = 'directeurS';

    /* ─── Teaching ────────────────────────────────────────────────────── */

    public const TEACHER = 'enseignant';

    /**
     * Cycle-bound teaching roles.
     *
     * Declared by the frontend (`ROLES.ENSEIGNEMENT*`, with labels
     * "Enseignement Maternelle/Primaire/Secondaire") and named in the project
     * brief, but no backend code assigns them yet. They are declared here so
     * that the day one is assigned, it inherits the teaching family and its
     * cycle instead of reproducing the `directeurP` lockout — a role that
     * exists in one layer and not the other is precisely how that happened.
     */
    public const TEACHER_SECONDARY    = 'enseignement';
    public const TEACHER_KINDERGARTEN = 'enseignementM';
    public const TEACHER_PRIMARY      = 'enseignementP';

    /* ─── Families ────────────────────────────────────────────────────── */

    /**
     * Members admitted when a route or policy gates on the family head.
     *
     * A cycle head is a head of school *for their cycle*. Which cycle they may
     * act on is a data question, not an access question, and it is enforced by
     * `ScopedToCycle` — not by routing. There are no cycle-specific endpoints:
     * the three heads share the `directeur` dashboard (see the frontend's
     * `ROLE_NORMALIZATION`), and the server confines what it returns. See
     * `cycleOf()` and `App\Support\CycleAccess`.
     */
    private const FAMILIES = [
        self::DIRECTOR => [
            self::DIRECTOR_KINDERGARTEN,
            self::DIRECTOR_PRIMARY,
            self::DIRECTOR_SECONDARY,
        ],
        self::TEACHER => [
            self::TEACHER_KINDERGARTEN,
            self::TEACHER_PRIMARY,
            self::TEACHER_SECONDARY,
        ],
    ];

    /**
     * Which cycle a role is confined to, or null when it spans the school.
     *
     * The plain `enseignant` role stays unconfined on purpose: a teacher may
     * hold classes in more than one cycle, and their reach is already bounded by
     * `enseignant_matiere`. Only the cycle-named variants are confined.
     */
    private const CYCLES = [
        self::DIRECTOR_KINDERGARTEN => Cycles::KINDERGARTEN,
        self::DIRECTOR_PRIMARY      => Cycles::PRIMARY,
        self::DIRECTOR_SECONDARY    => Cycles::SECONDARY,

        self::TEACHER_KINDERGARTEN  => Cycles::KINDERGARTEN,
        self::TEACHER_PRIMARY       => Cycles::PRIMARY,
        self::TEACHER_SECONDARY     => Cycles::SECONDARY,
    ];

    /**
     * Expand a list of gate roles to every role that satisfies it.
     *
     *   expand(['directeur'])            → directeur, directeurM/P/S
     *   expand(['directeur', 'censeur']) → the above, plus censeur
     *
     * Idempotent, so passing an already-expanded list is safe.
     */
    public static function expand(array $roles): array
    {
        $expanded = $roles;

        foreach ($roles as $role) {
            foreach (self::FAMILIES[$role] ?? [] as $member) {
                $expanded[] = $member;
            }
        }

        return array_values(array_unique($expanded));
    }

    /** Does this role satisfy a gate on any of the given roles? */
    public static function satisfies(?string $role, array $gate): bool
    {
        if ($role === null) {
            return false;
        }

        return in_array($role, self::expand($gate), true);
    }

    /** Every role that is a head of school, cycle heads included. */
    public static function directors(): array
    {
        return self::expand([self::DIRECTOR]);
    }

    /** Is this role a head of school? Excludes the platform super-admin. */
    public static function isDirector(?string $role): bool
    {
        return self::satisfies($role, [self::DIRECTOR]);
    }

    /**
     * The cycle a role is confined to — `Maternelle`, `Primaire`, `Secondaire`
     * — or null for a role that spans the whole school.
     *
     * Matches the capitalisation of `classes.categorie_classe` as validated on
     * write (`in:Maternelle,Primaire,Secondaire`).
     */
    public static function cycleOf(?string $role): ?string
    {
        return self::CYCLES[$role] ?? null;
    }
}
