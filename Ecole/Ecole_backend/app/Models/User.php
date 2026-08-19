<?php

namespace App\Models;

use App\Support\Roles;
use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToEcole, Auditable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'identifiant',
        'name',
        'prenom',
        'email',
        'telephone',
        'avatar',
        'password',
        'role',
        'ecole_id',
        'two_factor_enabled',
    ];

    protected $guarded = [
        'is_active',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'two_factor_enabled' => 'boolean',
        'password' => 'hashed',
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

    /**
     * Le profil Maternelle & Primaire derrière ce compte, s'il existe.
     *
     * `enseignant()` (secondaire) et `enseignantMP()` pointent vers deux
     * tables distinctes ; un compte porte au plus l'un des deux profils.
     */
    public function enseignantMP()
    {
        return $this->hasOne(EnseignantsMaternellePrimaire::class);
    }

    /**
     * The university student record behind this account, if any.
     *
     * `etudiants.user_id` did not exist, so this relation could not be written
     * and no personal view of the university module was possible. See
     * `2026_08_04_100000_link_university_profiles_to_accounts`.
     */
    public function etudiant()
    {
        return $this->hasOne(\App\Models\Universite\Etudiant::class);
    }

    /**
     * The university lecturer record behind this account, if any.
     *
     * Named apart from `enseignant()`, which resolves the *scholastic*
     * `enseignants` row. The two are separate tables and an account holds at
     * most one of them.
     */
    public function enseignantUniversite()
    {
        return $this->hasOne(\App\Models\Universite\Enseignant::class);
    }

    /**
     * Does this account satisfy a role gate?
     *
     * Family-aware, like the `role:` middleware: asking for `directeur` also
     * accepts a cycle head. Strict comparison — a loose `in_array` on role
     * strings is a footgun waiting for the first integer that reaches it.
     */
    public function hasRole(string|array $role): bool
    {
        return Roles::satisfies($this->role, is_array($role) ? $role : [$role]);
    }

    /** Head of school, or platform super-admin. */
    public function isAdmin(): bool
    {
        return Roles::isDirector($this->role) || $this->role === Roles::SUPER_ADMIN;
    }

    /**
     * The cycle this account is confined to, or null when it spans the school.
     */
    public function cycle(): ?string
    {
        return Roles::cycleOf($this->role);
    }
}
