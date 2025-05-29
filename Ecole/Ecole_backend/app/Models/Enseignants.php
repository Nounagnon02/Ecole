<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignants extends Model
{
    use HasFactory;
    protected $fillable= [
        'role',
        'nom',
        'prenom',
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

    public function matiere(){
        return $this->hasOne(matieres::class);
    }
}
