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
            'telephone' => $this->telephone,
            'email' => $this->email,
            'logo_url' => $this->logo_url,
            'type' => $this->type,
            'statut' => $this->statut ?? 'actif',
            'created_at' => $this->created_at?->isoFormat('LL'),
            'classes_count' => $this->whenCounted('classes'),
            'eleves_count' => $this->whenCounted('eleves'),
            'enseignants_count' => $this->whenCounted('enseignants'),
        ];
    }
}
