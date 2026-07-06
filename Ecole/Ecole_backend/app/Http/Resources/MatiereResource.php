<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MatiereResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'code' => $this->code,
            'coefficient' => $this->coefficient,
            'credit' => $this->credit,
            'categorie' => $this->categorie,
        ];
    }
}
