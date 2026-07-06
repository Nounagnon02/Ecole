<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'valeur' => (float) $this->valeur,
            'valeur_sur' => (float) ($this->valeur_sur ?? 20),
            'pourcentage' => $this->valeur_sur ? round(($this->valeur / $this->valeur_sur) * 100, 1) : null,
            'appreciation' => $this->appreciation,
            'date' => $this->date?->isoFormat('LL'),
            'created_at' => $this->created_at?->diffForHumans(),
            // Relations
            'eleve' => EleveResource::make($this->whenLoaded('eleve')),
            'matiere' => MatiereResource::make($this->whenLoaded('matiere')),
            'periode' => PeriodeResource::make($this->whenLoaded('periode')),
            'type_evaluation' => TypeEvaluationResource::make($this->whenLoaded('typeEvaluation')),
        ];
    }
}
