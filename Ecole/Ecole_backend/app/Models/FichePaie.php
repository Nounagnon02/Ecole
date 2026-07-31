<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FichePaie extends Model
{
    use HasFactory, BelongsToEcole;
    protected $table = 'fiches_paie';

    protected $fillable = [
        'user_id',
        'periode',
        'salaire_brut',
        'primes',
        'retenues',
        'salaire_net',
        'statut',
        'date_paiement',
        'ecole_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
