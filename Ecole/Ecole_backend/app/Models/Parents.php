<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Parents extends Model
{
    use HasFactory, HasApiTokens, Notifiable, BelongsToEcole;
    protected $fillable= [
        'role',
        'nom',
        'prenom',
        'email',
        'identifiant',
        'numero_de_telephone',
        'password1',
        'ecole_id'
    ];

    public function eleves()
    {
        return $this->belongsToMany(
            Eleves::class, 
            'eleves_parents', 
            'parent_id',  // Clé étrangère dans la table pivot pour ce modèle
            'eleve_id'    // Clé étrangère dans la table pivot pour le modèle lié
        );
    }
}
