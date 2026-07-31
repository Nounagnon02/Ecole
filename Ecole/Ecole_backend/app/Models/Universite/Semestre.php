<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Semestre extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'libelle',
        'annee_academique_id',
        'ecole_id',
    ];

    public function anneeAcademique()
    {
        return $this->belongsTo(AnneeAcademique::class);
    }

    public function matieres()
    {
        return $this->hasMany(Matiere::class);
    }
}
