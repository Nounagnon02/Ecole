<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = [
        'sujet', 'contenu', 'expediteur', 'destinataire', 'lu', 'ecole_id',
        'piece_jointe_chemin', 'piece_jointe_nom', 'piece_jointe_type', 'piece_jointe_taille',
    ];

    /** Le chemin du fichier sur le disque privé ne sort jamais de l'API. */
    protected $hidden = ['piece_jointe_chemin'];

    protected $casts = [
        'lu' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}