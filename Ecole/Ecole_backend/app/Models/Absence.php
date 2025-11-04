<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'date', 'type', 'justifiee', 'motif', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'date',
        'justifiee' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}