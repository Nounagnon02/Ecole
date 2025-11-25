<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnneeAcademique extends Model
{
    use HasFactory;

    protected $table = 'annee_academiques';
    protected $fillable = [
        'libelle',
        'date_debut',
        'date_fin'
    ];

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class);
    }

    public function semestres()
    {
        return $this->hasMany(Semestre::class);
    }
}
