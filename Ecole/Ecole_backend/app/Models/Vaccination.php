<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vaccination extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'nom_vaccin', 'date_vaccination', 'numero_lot', 'date_rappel', 'effets_secondaires', 'ecole_id'
    ];

    protected $casts = [
        'date_vaccination' => 'date',
        'date_rappel' => 'date',
        'effets_secondaires' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}