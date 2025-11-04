<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'description', 'date', 'gravite', 'statut', 'ecole_id'
    ];

    protected $casts = [
        'date' => 'datetime'
    ];
}