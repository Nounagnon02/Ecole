<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Personnel extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'poste',
        'telephone',
        'email',
        'universite_id'
    ];

    public function universite()
    {
        return $this->belongsTo(Universite::class);
    }
}
