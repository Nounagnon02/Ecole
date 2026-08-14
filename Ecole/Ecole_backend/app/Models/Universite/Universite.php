<?php

namespace App\Models\Universite;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Universite extends Model
{
    use HasFactory, BelongsToEcole;
    protected $fillable = [
        'nom',
        'sigle',
        'adresse',
        'telephone',
        'email',
        'site_web',
        'ecole_id',
    ];

    public function facultes()
    {
        return $this->hasMany(Faculte::class);
    }

    public function personnels()
    {
        return $this->hasMany(Personnel::class);
    }
}
