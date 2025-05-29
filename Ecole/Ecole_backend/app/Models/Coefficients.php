<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coefficients extends Model
{
    use HasFactory;
    protected $fillable = [
        'matiere_id',
        'serie',
        'coefficient',
    ];

    // Relation avec le modèle Matiere
    public function matiere()
    {
        return $this->belongsTo(Matieres::class, 'matiere_id');
    }
}
