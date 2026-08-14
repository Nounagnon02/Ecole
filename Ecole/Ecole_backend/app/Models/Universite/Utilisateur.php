<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Utilisateur extends Model
{
  // app/Models/Universite/Utilisateur.php


    use HasFactory, BelongsToEcole;
    protected $table = 'utilisateurs';
    protected $fillable = [
        'nom_utilisateur',
        'mot_de_passe',
        'role',
        'ecole_id',
    ];

    protected $hidden = [
        'mot_de_passe',
    ];
}
