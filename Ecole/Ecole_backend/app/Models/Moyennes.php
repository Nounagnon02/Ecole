<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Moyennes extends Model
{
    use BelongsToEcole, HasFactory;

    protected $fillable = [
        'eleve_id',
        'classe_id',
        'matiere_id',
        'periode',
        'annee_scolaire',
        'valeur',
        'coefficient',
        'rang',
        'total_eleves',
        'created_by',
        'ecole_id',
    ];

    protected $casts = [
        'valeur' => 'decimal:2',
        'coefficient' => 'decimal:2',
        'rang' => 'integer',
        'total_eleves' => 'integer',
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }
}
