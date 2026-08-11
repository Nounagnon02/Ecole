<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToEcole;

class ParentInvitation extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'parent_invitations';

    protected $fillable = [
        'ecole_id',
        'eleve_id',
        'created_by',
        'email',
        'token',
        'role',
        'is_primary',
        'is_guardian',
        'is_accepted',
        'accepted_at',
        'expires_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_guardian' => 'boolean',
        'is_accepted' => 'boolean',
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeValid($query)
    {
        return $query->where('is_accepted', false)
            ->where('expires_at', '>', now());
    }

    public function isValid(): bool
    {
        return !$this->is_accepted && $this->expires_at->isFuture();
    }

    public static function generateToken(): string
    {
        return hash('sha256', Str::random(40) . microtime(true));
    }
};