<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'motif', 'parent_id', 'eleve_id', 'enseignant_id', 'date', 'heure', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'datetime'
    ];

    public function parent()
    {
        return $this->belongsTo(UserParent::class);
    }

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }
}