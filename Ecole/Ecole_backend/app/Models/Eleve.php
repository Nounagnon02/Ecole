<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Eleve extends Model
{
    use HasFactory, BelongsToEcole, Auditable, ScopedToCycle, SoftDeletes;

    /** L'élève est inscrit. */
    public const ACTIVE = 'active';

    /** L'élève n'est plus inscrit, mais son dossier reste consultable. */
    public const INACTIVE = 'inactive';

    /**
     * Un élève appartient au cycle de sa classe.
     */
    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];
    }


    protected $fillable = [
        'user_id',
        'numero_matricule',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'classe_id',
        'serie_id',
        'ecole_id',
        'statut',
    ];

    /**
     * Rangs (ex æquo possible) de tous les élèves d'une classe, calculés sur
     * la moyenne de leurs notes : `[eleve_id => rang]`. Une seule requête par
     * classe, réutilisée pour toute la liste des enfants d'un parent.
     */
    public static function classRanks(int $classeId): array
    {
        $moyennes = Notes::query()
            ->whereHas('eleve', function ($q) use ($classeId) {
                $q->where('classe_id', $classeId);
            })
            ->get(['eleve_id', 'note'])
            ->groupBy('eleve_id')
            ->map(fn ($groupe) => round($groupe->avg('note'), 2));

        $sorted = $moyennes->sortDesc();

        $ranks = [];
        $position = 0;
        $last = null;
        foreach ($sorted as $eleveId => $moyenne) {
            $position++;
            if ($moyenne !== $last) {
                $rank = $position;
            }
            $ranks[$eleveId] = $rank;
            $last = $moyenne;
        }

        return $ranks;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parents()
    {
        return $this->belongsToMany(UserParent::class, 'eleves_parents', 'eleve_id', 'parent_id')
            ->withPivot(['role', 'is_primary', 'is_guardian'])
            ->using(ParentEleve::class);
    }

    /**
     * Le parent à contacter en priorité pour cet élève.
     *
     * `paiements.parents_id` référence ce responsable : sans lui, un règlement
     * créé pour un élève n'était rattaché à aucune famille, alors que la
     * filiation existe déjà dans `eleves_parents`.
     *
     * Le tuteur « premier parent venu » est déprécié : depuis que le pivot
     * porte `is_primary`, on renvoie le parent primaire de la filiation,
     * en ne retombant sur le premier parent lié que pour les données
     * historiques non encore réparties.
     */
    public function responsibleParent(): ?UserParent
    {
        return $this->parents()
            ->orderByDesc('eleves_parents.is_primary')
            ->first();
    }

    /**
     * La filiation primaire (contact de référence) de cet élève, si désignée.
     */
    public function primaryFiliation(): ?ParentEleve
    {
        return ParentEleve::where('eleve_id', $this->id)
            ->primary()
            ->first();
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class, 'classe_id');
    }

    public function serie()
    {
        return $this->belongsTo(Series::class, 'serie_id');
    }

    public function notes()
    {
        return $this->hasMany(Notes::class, 'eleve_id');
    }

    public function absences()
    {
        return $this->hasMany(Absence::class, 'eleve_id');
    }

    public function paiementEleve()
    {
        return $this->hasMany(PaiementEleve::class, 'eleve_id');
    }

    /**
     * Les matières suivies par l'élève, via le pivot `eleves_matieres`.
     *
     * `SeriesController::getElevesByMatiere` filtre les élèves d'une série sur
     * leur matière ; sans cette relation, `whereHas('matieres')` levait
     * « Call to undefined relationship ».
     */
    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'eleves_matieres', 'eleves_id', 'matieres_id')
                    ->withTimestamps();
    }

    /* ── Dossier scolaire & santé ────────────────────────────────────── */

    public function bourses()
    {
        return $this->hasMany(Bourse::class);
    }

    public function certificats()
    {
        return $this->hasMany(Certificat::class);
    }

    public function sanctions()
    {
        return $this->hasMany(Sanction::class);
    }

    public function vaccinations()
    {
        return $this->hasMany(Vaccination::class);
    }

    public function consultationsMedicales()
    {
        return $this->hasMany(ConsultationMedicale::class);
    }

    public function dossiersMedicaux()
    {
        return $this->hasMany(DossierMedical::class);
    }

    public function abonnementsTransport()
    {
        return $this->hasMany(AbonnementTransport::class);
    }

    public function emprunts()
    {
        return $this->hasMany(Emprunt::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }
}