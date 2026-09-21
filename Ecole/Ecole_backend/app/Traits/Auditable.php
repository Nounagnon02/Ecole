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
        // Ignorer les colonnes sensibles/bruit. `getOriginal()`/`getChanges()`
        // ignorent $hidden (qui ne s'applique qu'à toArray()/toJson()) : sans
        // cette liste, un changement de mot de passe ou de secret 2FA
        // écrirait sa valeur (chiffrée, mais quand même) dans `audit_logs` --
        // une deuxième copie du secret, dans une table pensée pour être
        // consultée bien plus largement que `users` lui-même.
        $ignore = ['updated_at', 'password', 'remember_token', 'two_factor_secret'];
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
                // `AuditLog::$casts` encode déjà ce champ en JSON à
                // l'écriture ; l'encoder ici aussi le fait deux fois --
                // relu, `old_values`/`new_values` renvoyait alors une chaîne
                // JSON encore encodée, pas un tableau. Jamais vu jusqu'ici
                // faute d'un seul lecteur de ces deux colonnes dans tout le
                // dépôt.
                'old_values' => $old ?: null,
                'new_values' => $new ?: null,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Ne pas casser l'opération principale si le log échoue
            report($e);
        }
    }
}
