<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Etudiant extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'telephone',
        'email',
        'adresse',
        'annee_entree',
        'filiere_id',
        'user_id',
        'ecole_id',
    ];

    /**
     * The login account this academic record belongs to, if one was issued.
     *
     * Nullable: enrolment happens at the registrar's desk and credentials come
     * later, so a record without an account is a normal state, not an error.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    /** Assignments in this student's filière. */
    public function devoirs()
    {
        return $this->belongsToMany(Devoir::class, 'uni_devoir_etudiant', 'etudiant_id', 'devoir_id')
            ->withPivot(['rendu', 'note', 'reponse', 'fichier', 'date_remise', 'commentaire'])
            ->withTimestamps();
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function diplomes()
    {
        return $this->hasMany(Diplome::class);
    }
}
