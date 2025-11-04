<?php

namespace App\Traits;

use App\Models\Ecole;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToEcole
{
    protected static function bootBelongsToEcole()
    {
        static::addGlobalScope('ecole', function (Builder $builder) {
            if ($ecoleId = auth()->user()->ecole_id ?? session('ecole_id')) {
                $builder->where('ecole_id', $ecoleId);
            }
        });

        static::creating(function ($model) {
            if (!$model->ecole_id) {
                $model->ecole_id = auth()->user()->ecole_id ?? session('ecole_id');
            }
        });
    }

    public function ecole()
    {
        return $this->belongsTo(Ecole::class);
    }
}
