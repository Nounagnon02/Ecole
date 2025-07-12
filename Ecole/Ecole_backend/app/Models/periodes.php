<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class periodes extends Model
{
    use HasFactory;
    protected $fillable = [
        'nom',
        'date_debut',
        'date_fin',
        'is_active'
    ];

    public function typeEvaluations()
    {
        return $this->belongsToMany(
            \App\Models\TypeEvaluation::class,
            'typeevaluation_classes',
            'periode_id',
            'typeevaluation_id'
        )->withPivot('classe_id')->withTimestamps();
    }
    

}
