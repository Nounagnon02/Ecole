<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Diplome extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'etudiant_id',
        'intitule',
        'date_delivrance',
        'mention',
        'ecole_id',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
