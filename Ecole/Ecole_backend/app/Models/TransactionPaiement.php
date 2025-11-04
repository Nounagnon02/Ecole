<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionPaiement extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'id_paiement_eleve',
        'tranche',
        'montant_paye',
        'date_paiement',
        'statut',
        'methode_paiement',
        'reference_transaction',
        'recu_par',
        'observation',
        'ecole_id',
    ];

    protected $casts = [
        'date_limite' => 'date',
        'date_paiement' => 'date'
    ];

    

    public function getEstEnRetardAttribute()
    {
        return $this->statut === 'EN_ATTENTE' && $this->date_limite < now();
    }

    public function paiementEleve()
    {
        return $this->belongsTo(PaiementEleve::class, 'id_paiement_eleve');
    }
}
