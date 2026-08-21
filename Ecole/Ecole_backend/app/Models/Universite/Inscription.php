<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inscription extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'etudiant_id',
        'annee_academique_id',
        'date_inscription',
        'montant_frais',
        'statut',
        'ecole_id',
    ];

    protected $casts = [
        'date_inscription' => 'date',
        'montant_frais' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }

    public function anneeAcademique()
    {
        return $this->belongsTo(AnneeAcademique::class);
    }
}
