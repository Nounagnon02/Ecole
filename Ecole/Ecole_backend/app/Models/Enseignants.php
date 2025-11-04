<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Enseignants extends Model
{
    use HasFactory, HasApiTokens, Notifiable, BelongsToEcole;
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
        'ecole_id'
    ];

    public function classe()
    {
        return $this->hasMany(Classes::class);
    }

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class,'enseignant_matiere','enseignant_id','matiere_id')->withPivot(['classe_id', 'serie_id']);
    }


}
