<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Filiation enrichie entre un parent et un élève (table `eleves_parents`).
 *
 * Le pivot porte désormais le rôle du parent dans la famille, la qualité de
 * parent primaire (contact de référence pour les paiements, notifications
 * et communications) et la qualité de tuteur légal.
 */
class ParentEleve extends Pivot
{
    public const ROLE_PERE = 'père';
    public const ROLE_MERE = 'mère';
    public const ROLE_TUTEUR = 'tuteur';
    public const ROLE_CORRESPONDANT = 'correspondant';

    public const ROLES = [
        self::ROLE_PERE,
        self::ROLE_MERE,
        self::ROLE_TUTEUR,
        self::ROLE_CORRESPONDANT,
    ];

    protected $table = 'eleves_parents';

    protected $fillable = [
        'parent_id',
        'eleve_id',
        'role',
        'is_primary',
        'is_guardian',
        'ecole_id',
    ];

    protected $casts = [
        'is_primary'   => 'boolean',
        'is_guardian'  => 'boolean',
    ];

    public function parent()
    {
        return $this->belongsTo(UserParent::class, 'parent_id');
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class, 'eleve_id');
    }

    /**
     * Les filiations où le parent est le contact de référence de l'élève.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Les filiations où le parent est tuteur légal.
     */
    public function scopeGuardian($query)
    {
        return $query->where('is_guardian', true);
    }

    /**
     * Désigne `$parentId` comme parent primaire de `$eleveId`.
     *
     * L'ancien parent primaire est rétrogradé dans la même transaction :
     * un élève n'a jamais qu'un seul contact de référence.
     */
    public static function setPrimary(int $eleveId, int $parentId): void
    {
        static::where('eleve_id', $eleveId)
            ->where('is_primary', true)
            ->update(['is_primary' => false]);

        static::where('eleve_id', $eleveId)
            ->where('parent_id', $parentId)
            ->update(['is_primary' => true]);
    }
}
