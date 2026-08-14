<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'immatriculation',
        'modele',
        'capacite',
        'chauffeur_nom',
        'chauffeur_tel',
        'is_active',
        'ecole_id',
    ];
}
