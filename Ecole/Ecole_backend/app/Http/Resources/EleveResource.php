<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EleveResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'matricule' => $this->matricule,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => $this->nom . ' ' . $this->prenom,
            'date_naissance' => $this->date_naissance?->isoFormat('LL'),
            'lieu_naissance' => $this->lieu_naissance,
            'sexe' => $this->sexe,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'statut' => $this->statut ?? 'actif',
            'tuteur_nom' => $this->tuteur_nom,
            'tuteur_telephone' => $this->tuteur_telephone,
            'created_at' => $this->created_at?->isoFormat('LL'),
            // Relations
            'classe' => ClasseResource::make($this->whenLoaded('classe')),
            'user' => UserResource::make($this->whenLoaded('user')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'notes_count' => $this->whenCounted('notes'),
            'paiements_total' => $this->whenAggregated('paiements', 'montant', 'sum'),
            // URLs
            'avatar_url' => $this->avatar_url,
            'qr_code_url' => $this->qr_code_url,
        ];
    }
}
