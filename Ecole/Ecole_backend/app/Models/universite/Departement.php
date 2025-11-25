<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'faculte_id'
    ];

    public function faculte()
    {
        return $this->belongsTo(Faculte::class);
    }

    public function filieres()
    {
        return $this->hasMany(Filiere::class);
    }

    public function enseignants()
    {
        return $this->hasMany(Enseignant::class);
    }
}
