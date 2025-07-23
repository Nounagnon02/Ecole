<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Enseignants extends Model
{
    use HasFactory ,HasApiTokens, Notifiable;
    protected $fillable= [
        'role',
        'nom',
        'prenom',
        'lieu_naissance',
        'date_naissance',
        'sexe',
        'email',
        'identifiant',
        'numero_de_telephone',
        'matiere_id',
        'class_id',
        'password1',
    ];

    public function classe()
    {
        return $this->hasMany(Classes::class);
    }

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'enseignant_matiere');
    }
}
