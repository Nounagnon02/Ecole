<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignants_Martenel_Primaire extends Model
{
    use HasFactory;

    protected $fillable= [
        'role',
        'nom',
        'prenom',
        'email',
        'identifiant',
        'numero_de_telephone',
        'class_id',
        'password1',
    ];


    public function matiere(){
        return $this->hasMany(matieres::class);
    }
}
