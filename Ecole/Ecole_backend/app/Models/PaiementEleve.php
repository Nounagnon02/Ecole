<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaiementEleve extends Model
{
    use HasFactory;
    protected $fillable = [
        "id_eleve",
        "id_contribution",
        "mode_paiement",
        "montant_total_paye",
        "montant_restant",
        "statut_global",
    ];

    public function paiement()
    {
        return $this->hasMany(TransactionPaiement::class, 'id_paiement_eleve');
    }

    /*public function statutsTranches()
    {
        return $this->hasMany(StatutTranche::class, 'id_paiement_eleve');
    }*/

    public function eleve()
    {
        return $this->belongsTo(Eleves::class, 'id_eleve');
    }


    public function contribution()
    {
        return $this->belongsTo(Contributions::class, 'id_contribution');
    }

    public function transactions()
    {
        return $this->hasMany(TransactionPaiement::class, 'id_paiement_eleve');
    }

    public function statutsTranches()
    {
        return $this->hasMany(StatutTranche::class, 'id_paiement_eleve');
    }

    // Méthodes utilitaires
    public function getMontantRestantAttribute()
    {
        return $this->contribution->montant - $this->montant_total_paye;
    }

    public function getPourcentagePaiementAttribute()
    {
        return ($this->montant_total_paye / $this->contribution->montant) * 100;
    }
}

