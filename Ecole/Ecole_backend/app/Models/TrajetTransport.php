<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrajetTransport extends Model
{
    use HasFactory;

    protected $table = 'trajets_transport';

    protected $fillable = [
        'nom_trajet',
        'zones',
        'prix_mensuel'
    ];
}
