<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificat extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'type_certificat', 'eleve_id', 'date_emission', 'numero_certificat', 'delivre', 'ecole_id'
    ];

    protected $casts = [
        'date_emission' => 'datetime',
        'delivre' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}