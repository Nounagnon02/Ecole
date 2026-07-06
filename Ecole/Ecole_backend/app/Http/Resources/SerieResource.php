<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SerieResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'abbreviation' => $this->abbreviation,
            'description' => $this->description,
            'classes_count' => $this->whenCounted('classes'),
        ];
    }
}
