<?php

namespace App\Casts;

use App\Support\Jour;
use DateTimeInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Database\Eloquent\SerializesCastableAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Remplace le cast `date` de Laravel pour les colonnes sans heure (R-32).
 *
 * Lecture : un `Jour` à minuit du fuseau de l'école, comme `date`. Écriture :
 * le comportement de `date`, inchangé (`fromDateTime`), pour ne rien changer
 * à ce qui est stocké. Seule la sortie JSON change : « Y-m-d », que la valeur
 * passe par `toArray()` ou soit posée telle quelle dans un tableau de réponse.
 */
class JourCalendaire implements CastsAttributes, SerializesCastableAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Jour
    {
        if ($value === null || $value === '') {
            return null;
        }

        // Ramené au fuseau de l'école avant de prendre le jour : Laravel
        // passe à `serialize()` la date déjà convertie en ISO UTC
        // (« …T23:00:00Z » pour le 16), qui donnerait sinon la veille.
        $fuseau = config('app.timezone');

        return ($value instanceof DateTimeInterface
            ? Jour::instance($value)
            : Jour::parse($value, $fuseau))->setTimezone($fuseau)->startOfDay();
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null || $value === '' ? null : $model->fromDateTime($value);
    }

    public function serialize(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        // Laravel peut passer ici la valeur brute de la colonne (chaîne).
        $jour = $value instanceof DateTimeInterface ? $value : $this->get($model, $key, $value, $attributes);

        return $jour?->format('Y-m-d');
    }
}
