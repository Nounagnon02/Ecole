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
        'user_id',
        'ecole_id',
    ];

    /**
     * The login account this staff record belongs to, if one was issued.
     *
     * Same hole as `Etudiant`, same fix: without it the server cannot tell
     * *which* lecturer is asking for "my courses".
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function departement()
    {
        return $this->belongsTo(Departement::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
