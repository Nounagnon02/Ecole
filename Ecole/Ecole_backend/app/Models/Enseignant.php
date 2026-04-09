<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'user_id',
        'specialite',
        'grade',
        'date_naissance',
        'lieu_naissance',
        'sexe'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'enseignant_matiere', 'enseignant_id', 'matiere_id')
                    ->withPivot(['classe_id', 'serie_id']);
    }
    
    public function classes()
    {
        return $this->belongsToMany(Classes::class, 'enseignant_matiere', 'enseignant_id', 'classe_id');
    }
}
