<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Moyennes extends Model
{
    use HasFactory;

    public function eleves(){
        return $this->belongsTo(eleves::class,'eleves_id');
    }
}
