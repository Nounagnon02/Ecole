<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Diplome extends Model
{
    use HasFactory;

    protected $fillable = [
        'etudiant_id',
        'intitule',
        'date_delivrance',
        'mention'
    ];

    public function etudiant()
    {
        return $this->belongsTo(Etudiant::class);
    }
}
