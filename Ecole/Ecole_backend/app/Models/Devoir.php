<?php

namespace App\Models;

use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Devoir extends Model
{
    use HasFactory, BelongsToEcole, Auditable;

    protected $fillable = [
        'enseignant_id',
        'classe_id',
        'matiere_id',
        'titre',
        'description',
        'date_limite',
        'fichier',
        'type',
        'publie',
        'ecole_id',
    ];

    protected $casts = [
        'date_limite' => 'datetime',
        'publie' => 'boolean',
    ];

    public function enseignant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enseignant_id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classes::class);
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matieres::class);
    }

    public function eleves(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'devoir_eleve', 'devoir_id', 'eleve_id')
            ->withPivot(['rendu', 'note', 'reponse', 'fichier', 'date_remise', 'commentaire'])
            ->withTimestamps();
    }
}
