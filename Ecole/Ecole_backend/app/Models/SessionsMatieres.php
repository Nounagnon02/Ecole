<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionsMatieres extends Model
{
    use HasFactory;

    protected $table = 'sessions_matieres';

    protected $fillable = [
        'session_id',
        'matiere_id',
    ];

    public function session()
    {
        return $this->belongsTo(Sessions::class, 'session_id');
    }

    public function matiere()
    {
        return $this->belongsTo(Matieres::class);
    }
}
