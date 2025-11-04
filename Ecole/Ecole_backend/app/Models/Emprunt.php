<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emprunt extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'livre_id', 'eleve_id', 'date_emprunt', 'date_retour_prevue', 'date_retour_effective', 'ecole_id'
    ];

    protected $casts = [
        'date_emprunt' => 'date',
        'date_retour_prevue' => 'date',
        'date_retour_effective' => 'date'
    ];

    public function livre()
    {
        return $this->belongsTo(Livre::class);
    }

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}