<?php

namespace App\Models;

use App\Support\Roles;
use App\Traits\Auditable;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToEcole, Auditable;

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
    ];

    /**
     * Inerte tant que `$fillable` est renseigné — Eloquent ne consulte `$guarded`
     * que si `$fillable` est vide. La protection réelle de `is_active` vient de
     * son absence du `$fillable` ci-dessus.
     *
     * Conservé pour que l'intention reste lisible : l'état d'un compte ne se
     * règle pas depuis une charge de requête, seulement depuis du code serveur
     * par affectation directe.
     */
    protected $guarded = [
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
        // Sans ce cast, `User::create(['password' => 'clair'])` stockait le mot
        // de passe en clair : le hachage reposait entièrement sur la discipline
        // de chaque appelant. Le cast est idempotent (il vérifie
        // Hash::isHashed), donc les Hash::make() existants restent corrects.
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
