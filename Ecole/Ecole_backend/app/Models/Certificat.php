<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use App\Traits\ScopedToCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificat extends Model
{
    use HasFactory, BelongsToEcole, ScopedToCycle;

    /**
     * Un certificat est délivré à un élève.
     */
    protected static function cyclePath(): array
    {
        return ['pupil' => 'eleve_id'];
    }


    protected $fillable = [
        'type_certificat', 'eleve_id', 'date_emission', 'numero_certificat', 'delivre', 'ecole_id'
    ];

    protected $casts = [
        'date_emission' => 'datetime',
        'delivre' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }
}