<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coefficients extends Model
{
    /**
     * Sans cette déclaration, Eloquent déduit `coefficients`, qui n'existe pas :
     * la table est `coefficient_matieres`. `SeriesController` et
     * `BulletinController` interrogeaient donc un modèle inutilisable.
     */
    protected $table = 'coefficient_matieres';

    use HasFactory, BelongsToEcole;
    /**
     * `serie_id`, pas `serie` : la colonne absente rendait l'assignation
     * silencieusement perdue. `classe_id` manquait entièrement, alors qu'un
     * coefficient se définit par (classe, série, matière) — sans elle, impossible
     * de créer une ligne complète par assignation de masse.
     */
    protected $fillable = [
        'matiere_id',
        'classe_id',
        'serie_id',
        'coefficient',
        'ecole_id',
    ];

    // Relation avec le modèle Matiere
    public function matiere()
    {
        return $this->belongsTo(Matieres::class, 'matiere_id');
    }
}
