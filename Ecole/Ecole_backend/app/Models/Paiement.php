<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'montant', 'type_paiement', 'date_paiement', 'statut', 'reference', 'ecole_id'
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