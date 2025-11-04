<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Moyennes extends Model
{
    use HasFactory, BelongsToEcole;

    protected $fillable = ['eleves_id', 'ecole_id'];

    public function eleves(){
        return $this->belongsTo(eleves::class,'eleves_id');
    }
}
