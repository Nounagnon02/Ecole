<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notes extends Model
{
    use Auditable, BelongsToEcole, HasFactory, ScopedToCycle;

    /**
     * Une note porte la classe où l'évaluation a eu lieu.
     */
    protected static function cyclePath(): array
    {
        return ['class' => 'classe_id'];
    }

    protected $fillable = [
        'eleve_id',
        'classe_id',
        'matiere_id',
        'note',
        'note_sur',
        'type_evaluation',
        'date_evaluation',
        'periode',
        'annee_scolaire',
        'observation',
        'locked',
        'created_by',
        'ecole_id',
    ];

    protected $casts = [
        'date_evaluation' => 'date',
        'note' => 'decimal:2',
        'note_sur' => 'decimal:2',
        'locked' => 'boolean',
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class, 'eleve_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }

    /*public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }*/

}
