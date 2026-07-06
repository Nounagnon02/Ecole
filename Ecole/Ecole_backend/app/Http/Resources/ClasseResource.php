<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClasseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'niveau' => $this->niveau,
            'section' => $this->section,
            'effectif' => $this->eleves_count ?? $this->eleves?->count() ?? 0,
            'created_at' => $this->created_at?->isoFormat('LL'),
            // Relations
            'serie' => SerieResource::make($this->whenLoaded('serie')),
            'eleves' => EleveResource::collection($this->whenLoaded('eleves')),
            'matieres' => MatiereResource::collection($this->whenLoaded('matieres')),
            'professeur_principal' => UserResource::make($this->whenLoaded('professeurPrincipal')),
        ];
    }
}
