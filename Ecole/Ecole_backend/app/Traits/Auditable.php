<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Auditable — Enregistre les modifications sur les modèles sensibles
 *
 * S'active automatiquement sur les événements created, updated, deleted.
 * Usage: use Auditable; dans le modèle.
 */
trait Auditable
{
    /**
     * Boot the trait — enregistre les listeners de modèle
     */
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            static::logAudit('created', $model, null, $model->toArray());
        });

        static::updated(function ($model) {
            // Ne loguer que les changements réels
            if ($model->getChanges()) {
                static::logAudit('updated', $model, $model->getOriginal(), $model->getChanges());
            }
        });

        static::deleted(function ($model) {
            static::logAudit('deleted', $model, $model->toArray(), null);
        });
    }

    /**
     * Enregistre une entrée dans audit_logs
     */
    protected static function logAudit(string $event, $model, ?array $old, ?array $new): void
    {
        // Ignorer les colonnes sensibles/bruit
        $ignore = ['updated_at', 'password', 'remember_token'];
        $old = $old ? array_diff_key($old, array_flip($ignore)) : null;
        $new = $new ? array_diff_key($new, array_flip($ignore)) : null;

        try {
            $user = Auth::user();
            $request = Request::instance();

            AuditLog::create([
                'user_id' => $user?->id,
                'ecole_id' => $user?->ecole_id ?? $model?->ecole_id ?? session('ecole_id'),
                'event' => $event,
                'auditable_type' => get_class($model),
                'auditable_id' => $model->id ?? $model->getKey(),
                'old_values' => $old ? json_encode($old) : null,
                'new_values' => $new ? json_encode($new) : null,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Ne pas casser l'opération principale si le log échoue
            report($e);
        }
    }
}
