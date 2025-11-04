<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ecole extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom', 'email', 'adresse', 'phone', 'logo', 'description',
        'status', 'pays', 'ville', 'code_postal', 'slug', 'domain'
    ];

    public function users() { return $this->hasMany(User::class); }
    public function eleves() { return $this->hasMany(Eleves::class); }
    public function enseignants() { return $this->hasMany(Enseignants::class); }
    public function parents() { return $this->hasMany(Parents::class); }
    public function classes() { return $this->hasMany(Classes::class); }
    public function matieres() { return $this->hasMany(Matieres::class); }
    public function series() { return $this->hasMany(Series::class); }
}
