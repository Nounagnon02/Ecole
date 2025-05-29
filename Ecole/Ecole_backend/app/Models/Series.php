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
        return $this->belongsToMany(Matieres::class, 'series_matieres')
            ->withPivot('coefficient');
    }

    public function eleves()
    {
        return $this->hasMany(Eleves::class, 'serie_id');
    }

    // Méthodes utilitaires
    public function getMatieresWithCoefficients()
    {
        return $this->matieres()->withPivot('coefficient')->get();
    }


public function calculMoyenneGenerale($eleve_id)
{
    $matieres = $this->getMatieresWithCoefficients();
    $total = 0;
    $totalCoef = 0;

    foreach ($matieres as $matiere) {
        $note = $matiere->notes()
            ->where('eleve_id', $eleve_id)
            ->avg('note');
            
        if ($note) {
            $total += $note * $matiere->pivot->coefficient;
            $totalCoef += $matiere->pivot->coefficient;
        }
    }

    return $totalCoef > 0 ? $total / $totalCoef : null;
}

// Exemples d'utilisation
/*$serie = Series::find(1);
$matieres = $serie->matieres; // Toutes les matières de la série
$matieresAvecCoef = $serie->getMatieresWithCoefficients(); 

$matiere = Matieres::find(1);
$series = $matiere->series; // Toutes les séries utilisant cette matière*/
}