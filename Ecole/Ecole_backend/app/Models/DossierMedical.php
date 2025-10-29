<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DossierMedical extends Model
{
    use HasFactory;

    protected $table = 'dossiers_medicaux';

    protected $fillable = [
        'eleve_id', 'groupe_sanguin', 'allergies', 'maladies_chroniques', 
        'contact_urgence', 'derniere_visite', 'vaccins_a_jour', 'aptitude_sport'
    ];

    protected $casts = [
        'derniere_visite' => 'datetime',
        'vaccins_a_jour' => 'boolean',
        'aptitude_sport' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}