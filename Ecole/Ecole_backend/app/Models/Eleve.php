<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Eleve extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'user_id',
        'numero_matricule',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'class_id',
        'serie_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parents()
    {
        return $this->belongsToMany(UserParent::class, 'eleves_parents', 'eleve_id', 'parent_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function serie()
    {
        return $this->belongsTo(Series::class, 'serie_id');
    }

    public function notes()
    {
        return $this->hasMany(Notes::class, 'eleve_id');
    }

    public function absences()
    {
        return $this->hasMany(Absence::class, 'eleve_id');
    }

    public function paiementEleve()
    {
        return $this->hasMany(PaiementEleve::class, 'eleve_id');
    }
}