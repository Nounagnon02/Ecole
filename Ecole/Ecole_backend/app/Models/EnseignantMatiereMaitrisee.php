<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Matières maîtrisées par un enseignant.
 *
 * À ne pas confondre avec `enseignant_matiere` : celui-ci est l'affectation
 * réelle (classe + série), celle-là est la compétence déclarée par
 * l'enseignant sur son profil.
 */
class EnseignantMatiereMaitrisee extends Pivot
{
    use BelongsToEcole;

    protected $table = 'enseignant_matiere_maitrisee';

    public $incrementing = true;

    protected $fillable = [
        'enseignant_id',
        'matiere_id',
        'ecole_id',
    ];

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }
}
