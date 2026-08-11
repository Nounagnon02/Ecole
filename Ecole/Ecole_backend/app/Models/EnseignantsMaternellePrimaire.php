<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnseignantsMaternellePrimaire extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'enseignants_maternelle_primaire';

    protected $fillable = [
        'user_id',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'classe_id',
        'ecole_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classes::class, 'classe_id');
    }
}
