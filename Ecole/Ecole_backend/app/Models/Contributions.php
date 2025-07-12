<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contributions extends Model
{
    use HasFactory;
    protected $fillable = [
        'montant',
        'date_fin_premiere_tranche',
        'date_fin_deuxieme_tranche',
        'date_fin_troisieme_tranche',
        'id_classe',
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
}
