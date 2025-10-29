<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Eleves extends Model
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $fillable = [
        'role',
        'nom',
        'prenom',
        'lieu_naissance',
        'date_naissance',
        'sexe',
        'numero_de_telephone',
        'identifiant',
        'password1',
        'numero_matricule',
        'class_id',
        'serie_id'
    ];

    public function sessions(){
        return $this->belongsToMany(Sessions::class,'sessions_eleves');
    }
    public function note()
    {
        return $this->hasMany(Notes::class, 'eleve_id');
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
    public function parents()
    {
        return $this->belongsToMany(
            Parent::class, 
            'eleves_parents', 
            'eleve_id', 
            'parent_id'
        );
    }

    // Ajout de la relation avec Series
    public function serie()
    {
        return $this->belongsTo(Series::class);
    }

    public function contribution(){
        return $this->belongsTo(Contributions::class);
    }

    public function paiementEleve()
    {
        return $this->hasMany(PaiementEleve::class, 'eleve_id');
    }
}

