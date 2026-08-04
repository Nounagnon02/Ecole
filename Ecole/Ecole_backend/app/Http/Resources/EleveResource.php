<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A pupil, as the API presents one.
 *
 * Not currently referenced by any controller — the endpoints build their arrays
 * by hand. It is corrected rather than deleted because the pattern is the right
 * one and this class is what someone will reach for first; left as it was, the
 * first endpoint to adopt it would have shipped a payload of nulls.
 *
 * The mistake was systematic: `matricule`, `nom`, `prenom`, `email`,
 * `telephone`, `adresse`, `statut`, `tuteur_nom` and `tuteur_telephone` were all
 * read straight off `eleves`, which holds none of them. The table holds
 * `numero_matricule` and the schooling keys; identity lives on `users`, reached
 * through the `user` relation.
 */
class EleveResource extends JsonResource
{
    public function toArray($request): array
    {
        // `whenLoaded` would hide the fields entirely rather than let them read
        // null, but identity is the point of this payload — so the relation is
        // read directly and the caller is expected to eager-load it. `?->`
        // keeps an unloaded relation from turning into a fatal error.
        $user = $this->user;

        return [
            'id'             => $this->id,
            'matricule'      => $this->numero_matricule,
            'nom'            => $user?->name,
            'prenom'         => $user?->prenom,
            'nom_complet'    => trim(($user?->prenom ?? '') . ' ' . ($user?->name ?? '')) ?: null,
            'date_naissance' => $this->date_naissance?->isoFormat('LL'),
            'lieu_naissance' => $this->lieu_naissance,
            'sexe'           => $this->sexe,

            // Contact details belong to the account, not to the pupil record.
            'email'     => $user?->email,
            'telephone' => $user?->telephone,

            // `eleves` carries no status column at all. The account's
            // `is_active` is the only thing that says whether a pupil is
            // currently enrolled; the old `$this->statut ?? 'active'` reported
            // every pupil as active, including deactivated ones.
            'statut' => ($user?->is_active ?? true) ? 'active' : 'inactive',

            'class_id'   => $this->class_id,
            'serie_id'   => $this->serie_id,
            'created_at' => $this->created_at?->isoFormat('LL'),

            'classe'    => ClasseResource::make($this->whenLoaded('classe')),
            'user'      => UserResource::make($this->whenLoaded('user')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),

            'notes_count'     => $this->whenCounted('notes'),
            'paiements_total' => $this->whenAggregated('paiements', 'montant', 'sum'),
        ];
    }
}
