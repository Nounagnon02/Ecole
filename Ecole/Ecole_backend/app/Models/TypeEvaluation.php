<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeEvaluation extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable=['nom','ecole_id'];


    public function periodes()
    {
        return $this->belongsToMany(
            \App\Models\periodes::class,
            'typeevaluation_classes',
            'typeevaluation_id',
            'periode_id'
        )->withPivot('classe_id')->withTimestamps();
    }
}
