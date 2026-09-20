<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Depense extends Model
{
    use HasFactory, BelongsToEcole, SoftDeletes;

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
        // `decimal(12,2)` : sans cast, MySQL le rend en chaîne et SQLite en
        // nombre. Même convention que les autres montants du domaine.
        'montant'      => 'decimal:2',
    ];
}
