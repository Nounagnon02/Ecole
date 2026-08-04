<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EcoleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'slug' => $this->slug,
            'adresse' => $this->adresse,
            'telephone' => $this->phone,
            'email' => $this->email,
            'logo_url' => $this->logo,
            // La colonne est `status`, pas `statut` : le repli `?? 'active'`
            // faisait rapporter *toute* école comme active, y compris celle
            // qu'on venait de désactiver.
            'statut' => $this->status ?? 'active',
            'created_at' => $this->created_at?->isoFormat('LL'),
            'classes_count' => $this->whenCounted('classes'),
            'eleves_count' => $this->whenCounted('eleves'),
            'enseignants_count' => $this->whenCounted('enseignants'),
        ];
    }
}
