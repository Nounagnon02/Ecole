<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\UserParent;

class PaiementEleve extends Model
{
    use HasFactory, BelongsToEcole, Auditable;
    
    protected $table = 'paiements';
    
    protected $fillable = [
        'eleve_id',
        'parents_id',
        'contribution_id',
        'montant',
        'montant_total',
        'montant_paye',
        'montant_restant',
        'statut',
        'statut_global',
        'type_paiement',
        'mode_paiement',
        'date_paiement',
        'reference',
        'ecole_id',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'montant_restant' => 'decimal:2',
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
        return $this->belongsTo(Eleve::class, 'eleve_id');
    }

    public function parent()
    {
        return $this->belongsTo(UserParent::class, 'parents_id');
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

