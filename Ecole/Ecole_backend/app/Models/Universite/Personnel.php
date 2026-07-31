<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Personnel extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'nom',
        'prenom',
        'poste',
        'telephone',
        'email',
        'universite_id',
        'ecole_id',
    ];

    public function universite()
    {
        return $this->belongsTo(Universite::class);
    }
}
