<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToEcole;

class Exercice extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'titre',
        'description',
        'classe_id',
        'enseignant_id',
        'date_limite',
        'ecole_id',
    ];

    protected $casts = [
        'date_limite' => 'date',
    ];

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classes::class);
    }

    public function enseignant(): BelongsTo
    {
        return $this->belongsTo(Enseignant::class);
    }
}
