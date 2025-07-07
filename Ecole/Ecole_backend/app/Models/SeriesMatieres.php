<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class SeriesMatieres extends Pivot
{
    protected $table = 'series_matieres';
    
    protected $fillable = [
        'serie_id',
        'matiere_id',
        'coefficient',
        'classe_id',
    ];
}