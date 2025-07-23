<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Enseignants_Martenel_Primaire extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $table = 'enseignants_martenel_primaire';

    protected $fillable = [
        'role',
        'nom',
        'prenom',
        'lieu_naissance',
        'date_naissance',
        'sexe',
        'email',
        'identifiant',
        'numero_de_telephone',
        'class_id',
        'password1',
    ];

    protected $hidden = [
        'password1',
        'remember_token',
    ];

    public function classe()
    {
        return $this->belongsTo(Classes::class,
            'enseignantmp_classe',
            'classe_id',              
            'enseignants_id');
    }
    public function matiere(){
        return $this->hasMany(matieres::class);
    }
}