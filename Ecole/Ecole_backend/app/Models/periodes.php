<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class periodes extends Model
{
    use HasFactory;
    protected $fillable=[
        'nom',
        'date_debut',
        'date_fin',
    ];

}
