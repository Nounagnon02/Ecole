<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id', 'montant', 'type_paiement', 'date_paiement', 'statut', 'reference'
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant' => 'decimal:2'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}