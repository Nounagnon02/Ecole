<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CahierDeTexte extends Model
{
    use HasFactory;

    protected $fillable = [
        'classe_id',
        'matiere_id',
        'enseignant_id',
        'date',
        'titre_lecon',
        'contenu',
        'devoirs_donnes'
    ];

    protected $casts = [
        'date' => 'date',
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
        return $this->belongsTo(Enseignant::class);
    }
}
