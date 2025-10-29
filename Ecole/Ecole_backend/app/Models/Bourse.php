<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id', 'type_bourse', 'montant', 'pourcentage', 'periode', 'statut'
    ];

    protected $casts = [
        'montant' => 'decimal:2'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}