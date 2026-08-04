<?php


namespace App\Models;

use App\Support\Cycles;
use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 *@property \Illuminate\Database\Eloquent\Collection|\App\Models\Series[] $series
 */
class Classes extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * La classe *est* le porteur du cycle : c'est l'ancre de toute la frontière.
     */
    protected static function cyclePath(): array
    {
        return ['self' => 'categorie_classe'];
    }

    protected $fillable= [
        'nom_classe',
        'categorie_classe',
        'ecole_id'
    ];

    /**
     * Store the cycle in one casing, whatever the caller sent.
     *
     * The column held both `Secondaire` and `secondaire` depending on which code
     * path wrote it, and every reader had to hope the database collation was
     * forgiving. Normalising on write means it only ever holds the canonical
     * form. An unrecognised value is left untouched so validation, not a silent
     * mutator, is what rejects it.
     */
    public function setCategorieClasseAttribute($value): void
    {
        $this->attributes['categorie_classe'] = Cycles::normalise($value) ?? $value;
    }

    public function eleves()
    {
        return $this->hasMany(Eleve::class, 'class_id');
    }

    // Ajout de méthodes utiles
    public function effectif()
    {
        return $this->eleves()->count();
    }
    
    public function enseignants()
    {
        return $this->belongsToMany(Enseignant::class, 'enseignant_matiere', 'classe_id', 'enseignant_id')
            ->withPivot('categorie_classe')
            ->withTimestamps();
    }


    public function enseignantsMP()
    {
        return $this->belongsToMany(
            EnseignantsMaternellePrimaire::class,
            'enseignantmp_classe',    // nom de la table pivot
            'classe_id',              // clé locale sur la table pivot
            'enseignants_id'          // clé étrangère sur la table pivot
        );
    }


    public function typeEvaluations()
    {
        return $this->belongsToMany(
            \App\Models\TypeEvaluation::class,
            'typeevaluation_classes',
            'classe_id',
            'typeevaluation_id'
        )->withPivot('periode_id')->withTimestamps();
    }
    /*public function matieres()
{
    return $this->belongsToMany(Matieres::class, 'classe_matiere')
                ->withPivot('categorie_classe')
                ->withTimestamps();
}*/


public function series()
{
    return $this->belongsToMany(Series::class, 'serie_matieres', 'classe_id', 'serie_id')
            ->withPivot('matiere_id', 'coefficient');
}


  public function contributions()
    {
        return $this->hasMany(\App\Models\Contributions::class, 'id_classe');
    }

}
