<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sessions extends Model
{
    use HasFactory;
    protected $fillable=['nom','statut','date_debut','date_fin'];
    
    public function matieres(){
        return $this->belongsToMany(Matieres::class,'sessions_matieres');
    }
    public function eleves(){
        return $this->belongsToMany(eleves::class,'sessions_candidats');
    }
    public function notes()
    {
        return $this->hasMany(Notes::class);
    }
}
