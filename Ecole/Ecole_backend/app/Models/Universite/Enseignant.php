<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    use HasFactory, BelongsToEcole;
    protected $table = 'uni_enseignants';

    protected $fillable = [
        'nom',
        'prenom',
        'grade',
        'specialite',
        'telephone',
        'email',
        'departement_id',
        'ecole_id',
    ];

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
