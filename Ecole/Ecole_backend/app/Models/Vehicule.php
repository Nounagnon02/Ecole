<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    use HasFactory;

    protected $fillable = [
        'immatriculation',
        'modele',
        'capacite',
        'chauffeur_nom',
        'chauffeur_tel',
        'is_active'
    ];
}
