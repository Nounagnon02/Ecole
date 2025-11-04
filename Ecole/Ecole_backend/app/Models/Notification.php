<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = ['user_id', 'type', 'titre', 'message', 'lu', 'ecole_id'];

    protected $casts = ['lu' => 'boolean'];
}
