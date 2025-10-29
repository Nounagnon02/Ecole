<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    use HasFactory;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'motif', 'parent_id', 'eleve_id', 'enseignant_id', 'date', 'heure', 'statut'
    ];

    protected $casts = [
        'date' => 'datetime'
    ];

    public function parent()
    {
        return $this->belongsTo(Parents::class);
    }

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }

    public function enseignant()
    {
        return $this->belongsTo(Enseignants::class);
    }
}