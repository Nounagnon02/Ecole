<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Utilisateur extends Model
{
  // app/Models/Utilisateur.php


    use HasFactory;

    protected $table = 'utilisateurs';
    protected $fillable = [
        'nom_utilisateur',
        'mot_de_passe',
        'role'
    ];

    protected $hidden = [
        'mot_de_passe',
    ];
}
