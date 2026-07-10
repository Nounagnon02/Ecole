<?php

namespace App\Traits;

use App\Models\Ecole;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToEcole
{
    protected static function bootBelongsToEcole()
    {
        static::addGlobalScope('ecole', function (Builder $builder) {
            if (static::class === \App\Models\User::class) {
                return;
            }
            $ecoleId = auth()->user()?->ecole_id ?? session('ecole_id');
            // Sécurité : si ecole_id est null, on bloque tout accès inter-écoles
            if ($ecoleId) {
                $builder->where($builder->getModel()->getTable().'.ecole_id', $ecoleId);
            } else {
                // Aucun résultat si l'utilisateur n'a pas d'école assignée
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model) {
            if (!$model->ecole_id) {
                $model->ecole_id = auth()->user()?->ecole_id ?? session('ecole_id');
            }
        });
    }

    public function ecole()
    {
        return $this->belongsTo(Ecole::class);
    }
}
