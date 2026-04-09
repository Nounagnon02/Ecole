<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Depense extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'ecole_id',
        'categorie',
        'description',
        'montant',
        'date_depense',
        'justificatif_path'
    ];

    protected $casts = [
        'date_depense' => 'date',
    ];
}
