<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sanction extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'type_sanction', 'motif', 'date', 'duree', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'date'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}