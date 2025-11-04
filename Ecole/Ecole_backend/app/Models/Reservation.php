<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'livre_id', 'eleve_id', 'date_reservation', 'date_limite', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date_reservation' => 'date',
        'date_limite' => 'date'
    ];

    public function livre()
    {
        return $this->belongsTo(Livre::class);
    }

    public function eleve()
    {
        return $this->belongsTo(Eleves::class);
    }
}