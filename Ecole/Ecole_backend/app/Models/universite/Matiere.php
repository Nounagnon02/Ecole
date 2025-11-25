<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'intitule',
        'credit',
        'enseignant_id',
        'semestre_id',
        'filiere_id'
    ];

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }

    public function semestre()
    {
        return $this->belongsTo(Semestre::class);
    }

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

}
