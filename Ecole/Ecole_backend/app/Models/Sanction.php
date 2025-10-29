<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sanction extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id', 'type_sanction', 'motif', 'date', 'duree', 'statut'
    ];

    protected $casts = [
        'date' => 'date'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}