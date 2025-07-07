<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 *@property \Illuminate\Database\Eloquent\Collection|\App\Models\Series[] $series
 */
class Classes extends Model
{
    use HasFactory;
    protected $fillable= [
        
        'nom_classe',
        'categorie_classe',
        
    ];

    public function eleves()
    {
        return $this->hasMany(Eleves::class, 'class_id');
    }

    // Ajout de méthodes utiles
    public function effectif()
    {
        return $this->eleves()->count();
    }
    
    public function enseignants()
    {
        return $this->belongsToMany(Enseignants::class)
            ->withPivot('categorie_classe')
            ->withTimestamps();
    }


    public function enseignantsMP()
    {
        return $this->belongsToMany(
            Enseignants_Martenel_Primaire::class,
            'enseignantmp_classe',    // nom de la table pivot
            'classe_id',              // clé locale sur la table pivot
            'enseignants_id'          // clé étrangère sur la table pivot
        );
    }

    public function TypeEvaluation()
    {
        return $this->belongsToMany(
            TypeEvaluation::class,
            'typeEvaluation_classe',    // nom de la table pivot
            'classe_id',              // clé locale sur la table pivot
            'evaluations_id'          // clé étrangère sur la table pivot
        );
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




}
