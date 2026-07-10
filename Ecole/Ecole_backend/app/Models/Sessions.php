<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sessions extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'sessions_academiques';

    protected $fillable = ['nom', 'statut', 'date_debut', 'date_fin', 'ecole_id'];

    public function matieres()
    {
        return $this->belongsToMany(Matieres::class, 'sessions_matieres');
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'sessions_candidats');
    }

    public function notes()
    {
        return $this->hasMany(Notes::class);
    }
}
