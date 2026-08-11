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
}

