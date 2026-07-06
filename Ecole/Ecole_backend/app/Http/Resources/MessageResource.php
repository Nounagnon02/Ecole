<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'sujet' => $this->sujet,
            'contenu' => $this->contenu,
            'lu' => $this->lu,
            'lu_at' => $this->lu_at?->diffForHumans(),
            'created_at' => $this->created_at?->diffForHumans(),
            'expediteur' => UserResource::make($this->whenLoaded('expediteur')),
            'destinataires' => UserResource::collection($this->whenLoaded('destinataires')),
            'pieces_jointes' => $this->pieces_jointes,
        ];
    }
}
