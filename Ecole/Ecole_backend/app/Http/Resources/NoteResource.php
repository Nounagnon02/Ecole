<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'valeur' => (float) ($this->note ?? 0),
            'valeur_sur' => (float) ($this->note_sur ?? 20),
            'pourcentage' => $this->note_sur ? round(($this->note / $this->note_sur) * 100, 1) : null,
            'appreciation' => $this->observation,
            'date' => $this->date_evaluation?->isoFormat('LL'),
            'created_at' => $this->created_at?->diffForHumans(),
            // Relations
            'eleve' => EleveResource::make($this->whenLoaded('eleve')),
            'matiere' => MatiereResource::make($this->whenLoaded('matiere')),
            'periode' => $this->periode,
            'type_evaluation' => $this->type_evaluation,
        ];
    }
}
