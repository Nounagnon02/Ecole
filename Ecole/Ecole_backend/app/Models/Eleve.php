<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Eleve extends Model
{
    use BelongsToEcole;
    protected $fillable = [
        'user_id', 'parent_id', 'classe_id', 'matricule', 
        'date_naissance', 'lieu_naissance', 'sexe'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class , 'class_id');
    }

/**
 * Return the notes of the eleve
 *
 * @return \Illuminate\Database\Eloquent\Relations\HasMany
 */
    public function notes()
    {
        return $this->hasMany(Notes::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    // ajout de la relation avec les ecoles

    public function ecole() {
        return $this->belongsTo(Ecole::class, 'ecole_id');
    }
}