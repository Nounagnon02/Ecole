<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\UserParent;

class PaiementEleve extends Model
{
    /**
     * Values of the `statut_global` column.
     *
     * The migration defaults it to 'EN_ATTENTE', and TransactionPaiement
     * already uses this uppercase convention, so we follow it here rather
     * than introduce a second spelling.
     */
    public const PENDING = 'EN_ATTENTE';
    public const PARTIAL = 'PARTIEL';
    public const PAID    = 'PAYE';

    use HasFactory, BelongsToEcole, Auditable, ScopedToCycle;

    /**
     * La scolarité d'un élève relève du cycle où il est inscrit ;
     * le comptable, lui, n'a pas de cycle et voit tout l'établissement.
     */
    protected static function cyclePath(): array
    {
        return ['pupil' => 'eleve_id'];
    }

    
    protected $table = 'paiements';
    
    protected $fillable = [
        'eleve_id',
        'parents_id',
        'contribution_id',
        'montant',
        'montant_total',
        'montant_paye',
        'montant_restant',
        // `statut` n'existe pas sur `paiements` : la colonne de statut est
        // `statut_global`. La déclarer assignable laissait croire qu'un
        // `create(['statut' => ...])` fonctionnait — c'est la même confusion qui
        // faisait filtrer ComptableController et DashboardController sur une
        // colonne absente.
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

    /*
     * Sémantique des colonnes de montant (documentée, pas de doublon réel) :
     *
     *   - `montant`        : montant de la ligne — ce que ce règlement apporte
     *                        (le seeder y inscrit le payé, `storePaiement` le
     *                        montant encaissé).
     *   - `montant_total`  : dû total de l'échéance (frais de scolarité, tranche).
     *   - `montant_paye`   : somme encaissée à ce jour sur l'échéance.
     *   - `montant_restant`: reste à payer (= total - paye, borné à 0 par
     *                        PaiementEleve::credit()).
     */

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

    /**
     * Share of the amount due that has been settled, as a percentage.
     *
     * `montant_total`, `montant_paye` and `montant_restant` are real columns.
     * There used to be a `getMontantRestantAttribute()` accessor here that
     * shadowed the `montant_restant` column and computed
     * `$this->contribution->montant - $this->montant_total_paye` instead —
     * which dereferenced a null relation whenever `contribution_id` was unset,
     * and read `montant_total_paye`, a column that does not exist. Any read of
     * `$paiement->montant_restant` therefore threw. The accessor is gone; the
     * column is authoritative.
     */
    public function getPourcentagePaiementAttribute(): float
    {
        $due = (float) $this->montant_total;

        if ($due <= 0) {
            return 0.0;
        }

        return round(((float) $this->montant_paye / $due) * 100, 2);
    }

    /**
     * Encaisser un versement sur cette échéance.
     *
     * Crédite `montant_paye`, débite `montant_restant` (borné à 0 en cas de
     * trop-perçu) et fait basculer `statut_global` de `EN_ATTENTE` vers
     * `PARTIEL` puis `PAYE`. C'est la seule écriture comptable autorisée sur
     * les soldes : tout chemin d'encaissement (comptable, échéancier en ligne,
     * rapprochement passerelle) doit passer par ici.
     *
     * La protection anti double-encaissement est du ressort de l'appelant
     * (ex. un webhook ne crédite que lors du passage pending → completed).
     */
    public function credit(float $montant): void
    {
        if ($montant <= 0) {
            return;
        }

        $this->montant_paye = (float) $this->montant_paye + $montant;
        $this->montant_restant = max(0, (float) $this->montant_restant - $montant);
        $this->statut_global = $this->montant_restant <= 0 ? self::PAID : self::PARTIAL;
        $this->save();
    }
}

