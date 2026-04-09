<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToEcole;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'identifiant',
        'name',
        'prenom',
        'email',
        'telephone',
        'password',
        'role',
        'ecole_id',
        'is_active'
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Profile relations
    public function eleve()
    {
        return $this->hasOne(Eleve::class);
    }

    public function parent()
    {
        return $this->hasOne(UserParent::class);
    }

    public function enseignant()
    {
        return $this->hasOne(Enseignant::class);
    }

    // Helper for checking roles
    public function hasRole(string|array $role): bool
    {
        if (is_array($role)) {
            return in_array($this->role, $role);
        }
        return $this->role === $role;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['directeur', 'directeurM', 'directeurP', 'directeurS', 'super-admin']);
    }
}
