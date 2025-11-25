<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etudiant extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'telephone',
        'email',
        'adresse',
        'annee_entree',
        'filiere_id'
    ];

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function diplomes()
    {
        return $this->hasMany(Diplome::class);
    }
}
