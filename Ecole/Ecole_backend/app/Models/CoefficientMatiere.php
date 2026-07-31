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