<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matieres extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable=['nom', 'ecole_id'];




    public function series()
    {
        return $this->belongsToMany(Series::class, 'serie_matieres', 'matiere_id', 'serie_id')
                    ->withPivot(['classe_id', 'coefficient'])
                    ->withTimestamps();
    }

// Ajoutez une nouvelle relation pour accéder aux coefficients par classe
public function coefficientsParClasse()
{
    return $this->hasManyThrough(
        CoefficientMatiere::class,
        SeriesMatieres::class,
        'matiere_id',
        'id',
        'id',
        'coefficient_id'
    );
}

    /*public function classes()
{
    return $this->belongsToMany(Classes::class, 'classe_matiere')
                ->withPivot('categorie_classe')
                ->withTimestamps();
}*/

    /**
     * Relation avec les notes
     */
    public function notes()
    {
        return $this->hasMany(Notes::class, 'matiere_id');
    }

    // Autres relations existantes...
    public function eleves()
    {
        return $this->belongsToMany(Eleves::class, 'eleve_matiere');
    }


    public function sessions(){
        return $this->belongsToMany(Sessions::class,'sessions_matieres');
    }




    public function coefficients()
{
    return $this->hasMany(Coefficients::class, 'matiere_id');
}



    public function enseignants()
    {
        return $this->belongsToMany(
            Enseignants::class,
            'enseignant_matiere',
            'matiere_id',
            'enseignant_id'
        )->withPivot(['classe_id', 'serie_id']);
    }

    /*public function enseignantPrimaire()
    {
        return $this->belongsTo(Enseignants_Martenel_Primaire::class, 'enseignants_id');
    }*/
    public function classe()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }



}
