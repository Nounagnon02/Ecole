<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Model;

/**
 * Journal d'audit.
 *
 * Porte `BelongsToEcole` : une entrée d'audit nomme un utilisateur et décrit
 * ce qu'il a modifié, c'est donc une donnée d'établissement au même titre
 * qu'une note ou un paiement. Sans le scope, le dashboard admin servait à
 * l'administrateur de l'école A les dix dernières actions de l'école B, noms
 * d'utilisateurs compris (cf. audit A3).
 *
 * La vue plateforme du super-admin (`Central\AnalyticsController::auditLogs`)
 * lève le scope explicitement : c'est le seul endroit qui doit lire au-delà
 * d'un établissement, et il est gardé par `role:super-admin`.
 */
class AuditLog extends Model
{
    use BelongsToEcole;

    protected $fillable = [
        'user_id',
        'ecole_id',
        'event',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
