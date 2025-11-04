<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaiementEleve extends Model
{
    use HasFactory, BelongsToEcole;
    
    protected $table = 'paiements';
    
    protected $fillable = [
        "eleve_id",
        "parents_id",
        "contribution_id",
        "montant_total",
        "montant_paye",
        "montant_restant",
        "statut_global",
        "ecole_id",
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
        return $this->belongsTo(Eleves::class, 'eleve_id');
    }

    public function parent()
    {
        return $this->belongsTo(Parents::class, 'parents_id');
    }

    public function contribution()
    {
        return $this->belongsTo(Contributions::class, 'contribution_id');
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

