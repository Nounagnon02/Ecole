<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    use HasFactory, BelongsToEcole, SoftDeletes;

    protected $fillable = [
        'user_id',
        'specialite',
        'grade',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'ecole_id',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'enseignant_matiere', 'enseignant_id', 'matiere_id')
                    ->using(EnseignantMatiere::class)
                    ->withPivot(['classe_id', 'serie_id']);
    }
    
    public function classes()
    {
        return $this->belongsToMany(Classes::class, 'enseignant_matiere', 'enseignant_id', 'classe_id')
                    ->using(EnseignantMatiere::class)
                    ->withPivot(['matiere_id', 'serie_id']);
    }

    /* ── Profil professionnel (cf. audit F3) ────────────────────────── */

    public function experiences()
    {
        return $this->hasMany(EnseignantExperience::class);
    }

    public function matieresMaitrisees()
    {
        return $this->belongsToMany(Matieres::class, 'enseignant_matiere_maitrisee', 'enseignant_id', 'matiere_id')
                    ->using(EnseignantMatiereMaitrisee::class)
                    ->withTimestamps();
    }

    /* ── Activités pédagogiques ──────────────────────────────────────── */

    public function exercices()
    {
        return $this->hasMany(Exercice::class);
    }

    public function cahierDeTextes()
    {
        return $this->hasMany(CahierDeTexte::class);
    }

    public function emploisDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    public function rendezVous()
    {
        return $this->hasMany(RendezVous::class);
    }
}