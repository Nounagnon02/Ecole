<?php

namespace App\Traits;

use App\Exceptions\OutsideCycleException;
use App\Models\Eleve;
use App\Support\CycleAccess;
use Illuminate\Database\Eloquent\Builder;

/**
 * Confine a model to the caller's cycle.
 *
 * Sits alongside `BelongsToEcole`: that trait answers *which school*, this one
 * *which cycle inside it*. Applied together they compose — the cycle filter is
 * always evaluated within a school, never across.
 *
 * ## Declaring the path
 *
 * `cyclePath()` is abstract on purpose. A model reaches its cycle in one of
 * three ways, and it must say which:
 *
 *   ['self'  => 'categorie_classe']   the model *is* the class
 *   ['class' => 'classe_id']          it holds a class key
 *   ['pupil' => 'eleve_id']           it holds a pupil, who holds the class
 *
 * Making it abstract means a model that adopts the trait without declaring a
 * path fails when the class is loaded, not silently at runtime with the filter
 * quietly absent. For an access boundary, a fatal error during development
 * beats an open door in production.
 *
 * ## Reads and writes
 *
 * The global scope covers reads. Writes need their own guard: a global scope
 * filters what comes back from a `select`, and does nothing at all about an
 * `insert`. Without the `saving` hook, a primary-cycle head could not *see* a
 * secondary class but could still enrol a pupil into one.
 */
trait ScopedToCycle
{
    /**
     * How this model reaches the cycle. See the class docblock.
     *
     * @return array{self?: string, class?: string, pupil?: string}
     */
    abstract protected static function cyclePath(): array;

    protected static function bootScopedToCycle(): void
    {
        static::addGlobalScope('cycle', function (Builder $builder) {
            $cycle = CycleAccess::cycle();

            // Unrestricted is the normal case — a general head, a teacher, a
            // pupil, a parent, the bursar. Adding no clause is the whole point.
            if ($cycle === null) {
                return;
            }

            $table = $builder->getModel()->getTable();
            $path  = static::cyclePath();

            if (isset($path['self'])) {
                $builder->where("{$table}.{$path['self']}", $cycle);

                return;
            }

            if (isset($path['class'])) {
                $builder->whereIn("{$table}.{$path['class']}", CycleAccess::classIds() ?? []);

                return;
            }

            if (isset($path['pupil'])) {
                // An Eloquent builder, so this compiles to a subquery that
                // carries the tenant scope with it.
                $builder->whereIn("{$table}.{$path['pupil']}", CycleAccess::pupilSubquery());

                return;
            }

            throw new \LogicException(
                static::class . '::cyclePath() must return one of self, class or pupil.'
            );
        });

        static::saving(function ($model) {
            if (!CycleAccess::isRestricted()) {
                return;
            }

            static::assertWithinCycle($model);
        });
    }

    /**
     * Refuse a write that would land outside the caller's cycle.
     *
     * Only the keys that changed are checked: re-saving an untouched record
     * that predates the cycle boundary must not fail, or a cycle head could
     * never correct a typo on an inherited row.
     */
    protected static function assertWithinCycle($model): void
    {
        $path  = static::cyclePath();
        $cycle = CycleAccess::cycle();

        if (isset($path['self'])) {
            $column = $path['self'];

            if ($model->isDirty($column) || !$model->exists) {
                if (\App\Support\Cycles::normalise($model->{$column}) !== $cycle) {
                    throw new OutsideCycleException(
                        "Un directeur de cycle ne peut agir que sur le cycle {$cycle}."
                    );
                }
            }

            return;
        }

        if (isset($path['class'])) {
            $column = $path['class'];

            if (($model->isDirty($column) || !$model->exists)
                && !CycleAccess::allowsClass($model->{$column})) {
                throw new OutsideCycleException(
                    "Cette classe n'appartient pas au cycle {$cycle}."
                );
            }

            return;
        }

        if (isset($path['pupil'])) {
            $column = $path['pupil'];

            if (!$model->isDirty($column) && $model->exists) {
                return;
            }

            // `withoutGlobalScope('cycle')` so the lookup can tell "outside my
            // cycle" apart from "does not exist" — with the scope on, both come
            // back null and the write would be refused with the wrong reason.
            $classId = Eleve::withoutGlobalScope('cycle')
                ->whereKey($model->{$column})
                ->value('class_id');

            if (!CycleAccess::allowsClass($classId)) {
                throw new OutsideCycleException(
                    "Cet élève n'appartient pas au cycle {$cycle}."
                );
            }
        }
    }
}
