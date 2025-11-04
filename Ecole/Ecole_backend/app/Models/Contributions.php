<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contributions extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'montant',
        'date_fin_premiere_tranche',
        'montant_premiere_tranche',
        'date_fin_deuxieme_tranche',
        'montant_deuxieme_tranche',
        'date_fin_troisieme_tranche',
        'montant_troisieme_tranche',
        'id_classe',
        'id_serie',
        'ecole_id',
    ];

    protected $casts = [
        'date_fin_premiere_tranche' => 'date',
        'date_fin_deuxieme_tranche' => 'date',
        'date_fin_troisieme_tranche' => 'date',
    ];
    public function classe()
    {
        return $this->belongsTo(Classes::class);
    }



    public function serie()
    {
        return $this->belongsTo(Series::class, 'id_serie');
    }

    public function paiements()
    {
        return $this->hasMany(PaiementEleve::class, 'id_contribution');
    }
    
}
