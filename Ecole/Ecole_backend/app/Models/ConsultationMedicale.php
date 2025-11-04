<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultationMedicale extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'eleve_id', 'motif', 'diagnostic', 'date', 'traitement', 'urgence', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'datetime',
        'urgence' => 'boolean'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}