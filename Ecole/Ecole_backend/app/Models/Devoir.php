<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Devoir extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre', 'description', 'classe_id', 'matiere_id', 'enseignant_id', 'date_limite'
    ];

    protected $casts = [
        'date_limite' => 'datetime'
    ];

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }

    public function enseignant()
    {
        return $this->belongsTo(Enseignants::class);
    }
}