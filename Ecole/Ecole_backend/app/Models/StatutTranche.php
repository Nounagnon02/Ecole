<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatutTranche extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'id_paiement_eleve',
        'tranche',
        'statut',
        'date_limite',
        'montant_tranche',
        'date_paiement',
        'ecole_id',
    ];
    protected $casts = [
        'date_limite' => 'datetime',
        'date_paiement' => 'datetime',
    ];

    public function paiementEleve()
    {
        return $this->belongsTo(PaiementEleve::class, 'id_paiement_eleve');
    }
}