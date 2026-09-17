<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoefficientMatiere extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = ['matiere_id', 'classe_id', 'serie_id', 'coefficient',
        'ecole_id',];

    /**
     * `coefficient` est un `decimal(5,2)`. Sans cast, PDO le rend en chaîne sur
     * MySQL et en nombre sur SQLite : l'API livrait « 3.00 » en production et 3
     * en test. `decimal:2` fixe la même forme partout, comme sur `Notes`,
     * `Moyennes` et `PaiementEleve` (cf. audit P2.1).
     */
    protected $casts = [
        'coefficient' => 'decimal:2',
    ];

    
    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }
    
    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }
    
    public function serie()
    {
        return $this->belongsTo(Series::class);
    }
}