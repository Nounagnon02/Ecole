<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Series extends Model
{
    use HasFactory;
    
    protected $fillable = ['nom'];
    protected $hidden = ['created_at', 'updated_at'];


    


        public function matieres()
        {
            return $this->belongsToMany(Matieres::class, 'serie_matieres', 'serie_id', 'matiere_id')
                        ->withPivot('classe_id', 'coefficient');
        }

        
        public function classes()
            {
                return $this->belongsToMany(
                    \App\Models\Classes::class,
                    'serie_matieres',
                    'serie_id',
                    'classe_id'
                )->withPivot('matiere_id', 'coefficient')->withTimestamps();
            }

    /**
     * Récupère les matières avec leurs coefficients
     */


    public function getMatieresWithCoefficientsByClasse($classe_id)
{
    return $this->matieres()
        ->wherePivot('classe_id', $classe_id)
        ->get()
        ->wherePivot('classe_id', $this->classe_id)
        ->map(function ($matiere) {
            return [
                'id' => $matiere->id,
                'nom' => $matiere->nom,
                'coefficient' => $matiere->pivot->coefficient
            ];
        
        });
}


    // Méthodes utilitaires
    


public function calculMoyenneGenerale($eleve_id)
    {
        $matieres = $this->matieres()->get();
        $totalPoints = 0;
        $totalCoefficients = 0;

        foreach ($matieres as $matiere) {
            // Récupérer la note de l'élève pour cette matière
            $note = $matiere->notes()->where('eleve_id', $eleve_id)->first();
            
            if ($note) {
                $coefficient = $matiere->pivot->coefficient;
                $totalPoints += $note->valeur * $coefficient;
                $totalCoefficients += $coefficient;
            }
        }

        return $totalCoefficients > 0 ? $totalPoints / $totalCoefficients : null;
    }

    // Autres relations existantes...
    public function eleves()
    {
        return $this->hasMany(Eleves::class, 'serie_id');
    }

    

// Exemples d'utilisation
/*$serie = Series::find(1);
$matieres = $serie->matieres; // Toutes les matières de la série
$matieresAvecCoef = $serie->getMatieresWithCoefficients(); 

$matiere = Matieres::find(1);
$series = $matiere->series; // Toutes les séries utilisant cette matière*/
}