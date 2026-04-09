<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class Personnel extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'personnel';

    protected $fillable = [
        'user_id',
        'poste',
        'type_contrat',
        'salaire_base',
        'date_embauche',
        'is_active'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
