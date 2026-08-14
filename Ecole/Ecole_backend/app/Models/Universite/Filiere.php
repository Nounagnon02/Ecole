<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Filiere extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'nom',
        'niveau',
        'departement_id',
        'ecole_id',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    public function etudiants()
    {
        return $this->hasMany(Etudiant::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
