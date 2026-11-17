<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionPaiement extends Model
{
    use HasFactory, BelongsToEcole;

    /**
     * Valeurs de la colonne `statut` — statut du règlement, pas de l'échéance.
     *
     * L'échéance (plan) porte son propre cycle EN_ATTENTE/PARTIEL/PAYE sur
     * `paiements.statut_global` et sur `statut_tranches.statut`.
     */
    public const EN_ATTENTE = 'EN_ATTENTE';
    public const APPROUVE  = 'APPROUVE';
    public const ECHEC     = 'ECHEC';

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
        'date_paiement' => 'datetime',
        'montant_paye' => 'decimal:2',
    ];

    /*
     * Rôle : un règlement RÉALISÉ sur une échéance (`paiements`).
     *
     * Une ligne = une tentative/opération de paiement (passerelle FedaPay,
     * caisse), suivie par `reference_transaction` et `methode_paiement`.
     * Elle n'a PAS de `date_limite` : l'échéance éventuelle relève du plan de
     * tranches `statut_tranches.date_limite`. Un ancien accesseur
     * `getEstEnRetardAttribute()` lisait ici `date_limite`, qui n'existe pas
     * sur cette table — `null < now()` est toujours false, l'accesseur
     * renvoyait systématiquement faux. Le calcul vit désormais sur
     * `StatutTranche`, qui possède réellement la colonne.
     *
     * `tranche` est un libellé libre (ex. le type d'échéance) et non une clé
     * vers `statut_tranches.id` : la table `statut_tranches` n'est alimentée
     * par aucun flux applicatif à ce jour, le rattachement fin d'un règlement
     * à une tranche du plan reste donc à implémenter.
     */
    public function paiementEleve()
    {
        return $this->belongsTo(PaiementEleve::class, 'id_paiement_eleve');
    }
}
