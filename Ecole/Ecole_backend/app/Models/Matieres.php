<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matieres extends Model
{
    use HasFactory;
    protected $fillable=['nom'];

    public function series()
    {
        return $this->belongsToMany(Series::class, 'series_matieres')
            ->withPivot('coefficient');
    }

    public function sessions(){
        return $this->belongsToMany(Sessions::class,'sessions_matieres');
    }

    public function notes()
    {
        return $this->hasOne(Notes::class);
    }


    public function coefficients()
{
    return $this->hasMany(Coefficients::class, 'matiere_id');
}
public function eleves()
{
    return $this->belongsToMany(Eleves::class, 'eleves_matieres');
}

}
