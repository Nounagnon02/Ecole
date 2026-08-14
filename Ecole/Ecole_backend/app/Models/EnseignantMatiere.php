<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Relations\Pivot;

class EnseignantMatiere extends Pivot
{
    use BelongsToEcole;

    protected $table = 'enseignant_matiere';

    // La table pivot porte un `id` auto-incrémenté : sans ce flag, `create()`
    // ne relit pas l'identifiant et `destroy` sur la ligne fraîche échouait.
    public $incrementing = true;

    protected $fillable = [
        'enseignant_id',
        'matiere_id',
        'classe_id',
        'serie_id',
        'ecole_id',
    ];

    public function enseignant()
    {
        return $this->belongsTo(Enseignant::class);
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class, 'classe_id');
    }

    public function serie()
    {
        return $this->belongsTo(Series::class, 'serie_id');
    }
}