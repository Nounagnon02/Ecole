<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnseignantExperience extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'enseignant_id',
        'poste',
        'etablissement',
        'date_debut',
        'date_fin',
        'description',
        'ecole_id',
    ];

    protected $casts = [
        'date_debut' => \App\Casts\JourCalendaire::class,
        'date_fin'   => \App\Casts\JourCalendaire::class,
    ];

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }
}
