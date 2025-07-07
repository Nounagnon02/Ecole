<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeEvaluation extends Model
{
    use HasFactory;

    protected $fillable=['nom'];


    public function classes()
    {
        return $this->belongsToMany(
            Classes::class,
            'typeEvaluation_classe',    // nom de la table pivot
            'classe_id',              // clé locale sur la table pivot
            'evaluations_id'          // clé étrangère sur la table pivot
        );
    }
}
