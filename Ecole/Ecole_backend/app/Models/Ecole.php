<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Ecole extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom', 'email', 'adresse', 'phone', 'logo', 'description',
        'status', 'pays', 'ville', 'code_postal', 'slug', 'domain'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * EcoleScope caches each school's active state to avoid a query per
     * request. Clearing it here means a deactivation takes effect on the next
     * request, wherever the status was changed from.
     */
    protected static function booted(): void
    {
        $forget = fn(self $school) => Cache::forget("school_active_{$school->id}");

        static::saved($forget);
        static::deleted($forget);
        static::restored($forget);
    }

    public function users() { return $this->hasMany(User::class); }
    public function eleves() { return $this->hasMany(Eleve::class); }
    public function enseignants() { return $this->hasMany(Enseignant::class); }
    public function parents() { return $this->hasMany(UserParent::class); }
    public function classes() { return $this->hasMany(Classes::class); }
    public function matieres() { return $this->hasMany(Matieres::class); }
    public function series() { return $this->hasMany(Series::class); }
}
