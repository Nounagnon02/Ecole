<?php

namespace App\Models;

use App\Support\CycleAccess;
use App\Support\Roles;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An announcement on the school's noticeboard.
 *
 * The audience is a **rule**, not a recipient list — see the migration for why.
 * Everything about who may read a given row therefore lives in one place, the
 * `visibleTo` scope, and is evaluated per reader at query time.
 *
 * No `ScopedToCycle`: `classe_id` is nullable and most rows are school-wide, so
 * the trait's `whereIn` would hide every school-wide announcement from the three
 * cycle heads. The cycle rule is enforced on write instead (see
 * `assertWithinCycle`).
 */
class Communication extends Model
{
    use HasFactory, BelongsToEcole;

    /* ─── Audiences ───────────────────────────────────────────────────── */

    public const AUDIENCE_SCHOOL = 'ecole';
    public const AUDIENCE_CYCLE  = 'cycle';
    public const AUDIENCE_CLASS  = 'classe';
    public const AUDIENCE_ROLE   = 'role';

    /* ─── Categories, as the frontend names them ──────────────────────── */

    public const CATEGORY_IMPORTANT = 'important';
    public const CATEGORY_INFO      = 'info';
    public const CATEGORY_EVENT     = 'event';

    protected $fillable = [
        'auteur_id',
        'titre',
        'contenu',
        'categorie',
        'audience',
        'audience_cycle',
        'audience_role',
        'classe_id',
        'tags',
        'epingle',
        'publie_le',
        'expire_le',
        'ecole_id',
    ];

    protected $casts = [
        'tags'      => 'array',
        'epingle'   => 'boolean',
        'publie_le' => 'datetime',
        'expire_le' => 'datetime',
    ];

    /**
     * Defaults on the model, not only on the column.
     *
     * A column default is applied by the insert and never reaches the in-memory
     * instance. `assertWithinCycle()` reads `$this->audience` *before* the save,
     * so a null there would skip the cycle check entirely on an announcement
     * posted without an explicit audience — the guard would be bypassed by
     * omission.
     */
    protected $attributes = [
        'categorie' => self::CATEGORY_INFO,
        'audience'  => self::AUDIENCE_SCHOOL,
        'epingle'   => false,
    ];

    public static function audiences(): array
    {
        return [self::AUDIENCE_SCHOOL, self::AUDIENCE_CYCLE, self::AUDIENCE_CLASS, self::AUDIENCE_ROLE];
    }

    public static function categories(): array
    {
        return [self::CATEGORY_IMPORTANT, self::CATEGORY_INFO, self::CATEGORY_EVENT];
    }

    /* ─── Relations ───────────────────────────────────────────────────── */

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classes::class);
    }

    /* ─── Scopes ──────────────────────────────────────────────────────── */

    /**
     * In force right now: published, not yet expired.
     *
     * A NULL `publie_le` counts as published — a row written without an explicit
     * schedule is live immediately, which is the common case. A NULL `expire_le`
     * never lapses.
     */
    public function scopeInForce(Builder $query, ?\DateTimeInterface $at = null): Builder
    {
        $at = $at ?: now();

        return $query
            ->where(fn(Builder $q) => $q->whereNull('publie_le')->orWhere('publie_le', '<=', $at))
            ->where(fn(Builder $q) => $q->whereNull('expire_le')->orWhere('expire_le', '>=', $at));
    }

    /**
     * Restrict to what this reader is addressed by.
     *
     * Four alternatives, one per audience. The interesting part is what happens
     * when the reader's own reach cannot be narrowed: staff who span the school
     * — the general head, the bursar, the registrar — see every cycle and every
     * class. That is the same convention as `CycleAccess`, where `null` means
     * *no filter* rather than *no access*, and for the same reason: narrowing by
     * default would blank the noticeboard for most of the staff.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        $cycles  = self::readableCycles($user);
        $classes = self::readableClasses($user);
        $gates   = Roles::gatesSatisfiedBy($user->role);

        return $query->where(function (Builder $q) use ($cycles, $classes, $gates) {
            $q->where('audience', self::AUDIENCE_SCHOOL);

            $q->orWhere(function (Builder $q) use ($gates) {
                $q->where('audience', self::AUDIENCE_ROLE)->whereIn('audience_role', $gates);
            });

            $q->orWhere(function (Builder $q) use ($cycles) {
                $q->where('audience', self::AUDIENCE_CYCLE);

                if ($cycles !== null) {
                    $q->whereIn('audience_cycle', $cycles);
                }
            });

            $q->orWhere(function (Builder $q) use ($classes) {
                $q->where('audience', self::AUDIENCE_CLASS);

                if ($classes !== null) {
                    $q->whereIn('classe_id', $classes);
                }
            });
        });
    }

    /** Pinned first, then newest first — the order the feed renders in. */
    public function scopeFeedOrder(Builder $query): Builder
    {
        return $query->orderByDesc('epingle')->orderByDesc('publie_le')->orderByDesc('id');
    }

    /* ─── Who reaches which cycles and classes ────────────────────────── */

    /**
     * The cycles this reader is addressed by, or null for all of them.
     */
    private static function readableCycles(User $user): ?array
    {
        // A cycle head is confined by their role, and `CycleAccess` already
        // answers that question for the whole application.
        if ($cycle = CycleAccess::cycle()) {
            return [$cycle];
        }

        $classes = self::readableClasses($user);

        if ($classes === null) {
            return null;
        }

        $cycles = Classes::whereIn('id', $classes)
            ->pluck('categorie_classe')
            ->map(fn($value) => \App\Support\Cycles::normalise($value))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $cycles;
    }

    /**
     * The classes this reader is addressed by, or null for all of them.
     *
     * A pupil has one, a parent has their children's, a teacher has those they
     * hold. Everyone else spans the school.
     */
    private static function readableClasses(User $user): ?array
    {
        if ($cycle = CycleAccess::cycle()) {
            return CycleAccess::classIds() ?? [];
        }

        return match (true) {
            $user->role === 'eleve'  => array_filter([$user->eleve?->classe_id]),
            $user->role === 'parent' => $user->parent
                ? $user->parent->eleves()->pluck('eleves.classe_id')->filter()->unique()->values()->all()
                : [],
            Roles::satisfies($user->role, [Roles::TEACHER]) => $user->enseignant
                ? $user->enseignant->classes()->pluck('classes.id')->unique()->values()->all()
                : [],
            default => null,
        };
    }

    /* ─── Write-side cycle guard ──────────────────────────────────────── */

    /**
     * Refuse an announcement a cycle head is not entitled to publish.
     *
     * The read side needs no such guard — the audience rule already decides who
     * sees what — but the write side does: without it the primary head could
     * post to the secondary's classes, which is exactly the authority the cycle
     * boundary exists to separate. Modelled on `ScopedToCycle::assertWithinCycle`
     * but called explicitly, because the audience columns are nullable and a
     * global scope cannot express "only when this discriminator says so".
     *
     * @throws \App\Exceptions\OutsideCycleException
     */
    public function assertWithinCycle(): void
    {
        $cycle = CycleAccess::cycle();

        if ($cycle === null) {
            return;
        }

        if ($this->audience === self::AUDIENCE_CYCLE
            && \App\Support\Cycles::normalise($this->audience_cycle) !== $cycle) {
            throw new \App\Exceptions\OutsideCycleException(
                "Un directeur de cycle ne peut publier que pour le cycle {$cycle}."
            );
        }

        if ($this->audience === self::AUDIENCE_CLASS
            && !CycleAccess::allowsClass($this->classe_id)) {
            throw new \App\Exceptions\OutsideCycleException(
                "Cette classe n'appartient pas au cycle {$cycle}."
            );
        }
    }
}
