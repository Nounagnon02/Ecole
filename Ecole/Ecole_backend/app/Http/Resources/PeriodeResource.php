<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PeriodeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'date_debut' => $this->date_debut?->isoFormat('LL'),
            'date_fin' => $this->date_fin?->isoFormat('LL'),
            'est_active' => $this->est_active ?? false,
        ];
    }
}
