<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'uni_paiements';

    protected $fillable = [
        'etudiant_id',
        'montant',
        'date_paiement',
        'motif',
        'ecole_id',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
