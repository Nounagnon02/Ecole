<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * L'absence ne connaît que l'élève ; la classe vient de lui.
     */
    protected static function cyclePath(): array
    {
        return ['pupil' => 'eleve_id'];
    }


    protected $fillable = [
        'eleve_id', 'date', 'type', 'justifiee', 'motif', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'date',
        'justifiee' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }
}