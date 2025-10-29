<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Livre extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre', 'auteur', 'isbn', 'categorie', 'annee_publication', 'nombre_exemplaires', 'disponible'
    ];

    protected $casts = [
        'disponible' => 'boolean'
    ];

    public function emprunts()
    {
        return $this->hasMany(Emprunt::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}