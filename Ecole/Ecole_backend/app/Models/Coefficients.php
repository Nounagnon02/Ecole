<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coefficients extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'matiere_id',
        'serie',
        'coefficient',
        'ecole_id',
    ];

    // Relation avec le modèle Matiere
    public function matiere()
    {
        return $this->belongsTo(Matieres::class, 'matiere_id');
    }
}
