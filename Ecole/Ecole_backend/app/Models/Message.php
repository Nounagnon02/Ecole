<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'sujet', 'contenu', 'expediteur', 'destinataire', 'lu', 'ecole_id'
    ];

    protected $casts = [
        'lu' => 'boolean'
    ];
}