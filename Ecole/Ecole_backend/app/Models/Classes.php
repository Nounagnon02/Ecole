<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        return $this->belongsToMany(Enseignants::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matieres::class);
    }

    public function moyenneGenerale()
{
    return $this->eleves()
        ->with('moyennes')
        ->get()
        ->avg('moyennes.moyenne_generale');
}



}
