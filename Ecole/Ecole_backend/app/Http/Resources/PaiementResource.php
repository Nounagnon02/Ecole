<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'montant' => (float) $this->montant,
            'montant_formate' => number_format($this->montant, 0, ',', ' ') . ' FCFA',
            'type' => $this->type,
            'type_label' => __("paiements.types.{$this->type}"),
            'mode_paiement' => $this->mode_paiement,
            'mode_label' => __("paiements.modes.{$this->mode_paiement}"),
            'statut' => $this->statut,
            'date_paiement' => $this->date_paiement?->isoFormat('LL'),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->diffForHumans(),
            // Relations
            'eleve' => EleveResource::make($this->whenLoaded('eleve')),
            'classe_nom' => $this->when($this->relationLoaded('eleve'), fn() =>
                $this->eleve->classe?->nom
            ),
        ];
    }
}
