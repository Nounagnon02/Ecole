<?php

namespace App\Traits;

use App\Models\Ecole;
use App\Support\SchoolContext;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToEcole
{
    protected static function bootBelongsToEcole()
    {
        static::addGlobalScope('ecole', function (Builder $builder) {
            if (static::class === \App\Models\User::class) {
                return;
            }

            $ecoleId = static::resolveEcoleId();

            // Sécurité : si ecole_id est null, on bloque tout accès inter-écoles
            if ($ecoleId) {
                $builder->where($builder->getModel()->getTable().'.ecole_id', $ecoleId);
            } else {
                // Aucun résultat si l'utilisateur n'a pas d'école assignée
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model) {
            if (!$model->ecole_id) {
                $model->ecole_id = static::resolveEcoleId();
            }
        });
    }

    /**
     * Quelle école, pour la requête ou le traitement en cours.
     *
     * Trois sources, dans cet ordre, et l'ordre est une décision de sécurité :
     *
     *  1. l'école de l'utilisateur authentifié — elle gagne toujours. Si un
     *     contexte explicite pouvait la surcharger, tout code qui en pose un
     *     deviendrait un moyen de lire les données d'un autre établissement en
     *     étant connecté sous une identité qui ne le peut pas.
     *  2. un contexte explicite (`SchoolContext`) — pour ce qui tourne hors
     *     requête HTTP : seeders, commandes Artisan, jobs en file. Sans lui,
     *     `ecole_id` restait null à l'écriture (la ligne n'appartenait à aucune
     *     école et devenait invisible pour tous) et la lecture retombait sur
     *     `1 = 0`. Les deux échecs étaient silencieux.
     *  3. la session — c'est par là que `EcoleScope` fait cibler un
     *     établissement à un super-admin via l'en-tête `X-Ecole-Id`.
     */
    protected static function resolveEcoleId(): ?int
    {
        $fromUser = auth()->user()?->ecole_id;

        if ($fromUser) {
            return (int) $fromUser;
        }

        if ($fromContext = SchoolContext::current()) {
            return (int) $fromContext;
        }

        $fromSession = session('ecole_id');

        return $fromSession ? (int) $fromSession : null;
    }

    public function ecole()
    {
        return $this->belongsTo(Ecole::class);
    }
}
