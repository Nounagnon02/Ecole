<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Examen extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'nom', 'type', 'date_debut', 'date_fin', 'classes', 'matieres', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date_debut' => \App\Casts\JourCalendaire::class,
        'date_fin' => \App\Casts\JourCalendaire::class,
        'classes' => 'array',
        'matieres' => 'array'
    ];
}