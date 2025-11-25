<?php

namespace App\Models\Universite;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculte extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'sigle',
        'universite_id'
    ];

    public function universite()
    {
        return $this->belongsTo(Universite::class);
    }

    public function departements()
    {
        return $this->hasMany(Departement::class);
    }
}
