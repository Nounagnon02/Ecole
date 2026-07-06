<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->role ? __("roles.{$this->role}") : null,
            'telephone' => $this->telephone,
            'avatar' => $this->avatar_url,
            'ecole_id' => $this->ecole_id,
            'statut' => $this->statut ?? 'actif',
            'derniere_connexion' => $this->last_login_at?->diffForHumans(),
            'created_at' => $this->created_at?->isoFormat('LL'),
            'updated_at' => $this->updated_at?->diffForHumans(),
            // Relations conditionnelles
            'ecole' => EcoleResource::make($this->whenLoaded('ecole')),
            'permissions' => $this->when($this->relationLoaded('permissions'), fn() =>
                $this->getAllPermissions()->pluck('name')
            ),
        ];
    }
}
