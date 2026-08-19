<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sanction extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle, SoftDeletes;

    /**
     * Une sanction vise un élève.
     */
    protected static function cyclePath(): array
    {
        return ['pupil' => 'eleve_id'];
    }


    protected $fillable = [
        'eleve_id', 'type_sanction', 'motif', 'date', 'duree', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'date'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }
}