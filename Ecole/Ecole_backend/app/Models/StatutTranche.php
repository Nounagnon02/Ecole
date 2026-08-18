<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatutTranche extends Model
{
    use HasFactory, BelongsToEcole;

    /**
     * Valeurs de la colonne `statut` — statut d'une tranche du plan.
     *
     * Mêmes valeurs que `paiements.statut_global` (`PaiementEleve`) : la
     * tranche suit le même cycle EN_ATTENTE → PARTIEL → PAYE.
     */
    public const EN_ATTENTE = 'EN_ATTENTE';
    public const PARTIEL   = 'PARTIEL';
    public const PAYE      = 'PAYE';

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

    /*
     * Rôle : le PLAN des tranches d'une échéance (`paiements`).
     *
     * Une ligne = une tranche prévue (numéro/libellé, montant, échéance
     * `date_limite`, statut). C'est le porteur de `date_limite` : les
     * règlements qui la réalisent vivent dans `transaction_paiements` et n'ont
     * pas de date limite. `transaction_paiements.tranche` (libellé libre) ne
     * référence pas encore cette table — aucun flux applicatif n'alimente
     * `statut_tranches` à ce jour.
     */
    public function getEstEnRetardAttribute(): bool
    {
        return $this->statut === self::EN_ATTENTE
            && $this->date_limite !== null
            && $this->date_limite->isPast();
    }

    public function paiementEleve()
    {
        return $this->belongsTo(PaiementEleve::class, 'id_paiement_eleve');
    }
}