<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Eleves extends Model
{
    use HasFactory;
    protected $fillable=[
        'role',
        'nom_de_eleve',
        'prenoms_eleve',
        'numero_de_telephone',
        'identifiant',
        'password1',
        'class_id',
        'serie_id',
        'numero_matricule'
];

    public function sessions(){
        return $this->belongsToMany(Sessions::class,'sessions_eleves');
    }
    public function notes()
    {
        return $this->hasMany(Notes::class);
    }

    public function moyennes(){
        return $this->hasOne(Moyennes::class);
    }
    

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'eleves_matieres');
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    // Ajout de la relation avec Series
    public function serie()
    {
        return $this->belongsTo(Series::class, 'serie_id');
    }

    public function scopeActif($query)
{
    return $query->whereHas('classe', function($q) {
        $q->active();
    });
}
public function moyenneParMatiere($matiere_id, $periode = null)
    {
        $query = $this->notes()
            ->where('matiere_id', $matiere_id);
            
        if ($periode) {
            $query->where('periode', $periode);
        }

        return $query->avg('note');
    }

    // Nouvelle méthode pour calculer la moyenne générale
    public function moyenneGenerale($periode = null)
    {
        $notes = $this->notes()
            ->when($periode, function($query) use ($periode) {
                return $query->where('periode', $periode);
            })
            ->get()
            ->groupBy('matiere_id')
            ->map(function($notesMatiere) {
                return $notesMatiere->avg('note');
            });

        // Récupération des coefficients de la série
        $coefficients = $this->serie->matieres()
            ->withPivot('coefficient')
            ->get()
            ->pluck('pivot.coefficient', 'id');

        $totalPoints = 0;
        $totalCoefficients = 0;

        foreach ($notes as $matiereId => $moyenne) {
            $coefficient = $coefficients[$matiereId] ?? 1;
            $totalPoints += $moyenne * $coefficient;
            $totalCoefficients += $coefficient;
        }

        return $totalCoefficients > 0 ? $totalPoints / $totalCoefficients : 0;
    }

    // Méthode pour obtenir le classement de l'élève
    public function getClassement($periode = null)
    {
        $moyennes = static::where('class_id', $this->class_id)
            ->get()
            ->map(function($eleve) use ($periode) {
                return [
                    'eleve_id' => $eleve->id,
                    'moyenne' => $eleve->moyenneGenerale($periode)
                ];
            })
            ->sortByDesc('moyenne')
            ->values();

        $position = $moyennes->search(function($item) {
            return $item['eleve_id'] === $this->id;
        }) + 1;

        return [
            'position' => $position,
            'total_eleves' => $moyennes->count()
        ];
    }


    // Méthode pour vérifier si l'élève est en échec
    public function estEnEchec($periode = null)
    {
        return $this->moyenneGenerale($periode) < 10;
    }


// Exemples d'utilisation
/*$classe = Classes::find(1);
$eleves = $classe->eleves; // Liste des élèves
$effectif = $classe->effectif(); // Nombre d'élèves

$eleve = Eleves::find(1);
$classe = $eleve->classe; // Classe de l'élève
$moyenne = $eleve->moyenneParMatiere(1); // Moyenne dans une matière*/
}

