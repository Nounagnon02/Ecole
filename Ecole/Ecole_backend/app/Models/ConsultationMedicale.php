<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultationMedicale extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id', 'motif', 'diagnostic', 'date', 'traitement', 'urgence'
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