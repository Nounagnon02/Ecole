<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'description', 'date', 'gravite', 'statut'
    ];

    protected $casts = [
        'date' => 'datetime'
    ];
}