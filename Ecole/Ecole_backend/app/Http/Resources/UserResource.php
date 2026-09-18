<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            // `users` n'a ni `avatar_url` ni `last_login_at` : les deux champs
            // ont été retirés plutôt que de servir un `null` permanent. Les
            // rétablir suppose d'abord d'ajouter les colonnes.
            'nom' => $this->name,
            'prenom' => $this->prenom,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->role ? __("roles.{$this->role}") : null,
            'telephone' => $this->telephone,
            'ecole_id' => $this->ecole_id,
            // `users` n'a pas de colonne `statut` : l'état d'un compte est
            // porté par `is_active`, que le repli masquait entièrement — un
            // compte désactivé s'affichait actif.
            'statut' => ($this->is_active ?? true) ? 'active' : 'inactive',
            'created_at' => $this->created_at?->isoFormat('LL'),
            'updated_at' => $this->updated_at?->diffForHumans(),
            // Relations conditionnelles
            'ecole' => EcoleResource::make($this->whenLoaded('ecole')),
            // `permissions` venait de `spatie/laravel-permission`, dépendance
            // installée mais jamais utilisée : `User` ne porte pas `HasRoles`,
            // la relation n'existait pas et `getAllPermissions()` non plus. La
            // clé n'était donc jamais émise. Les droits passent par la colonne
            // `role` et le middleware `CheckRole` (cf. audit P3.4).
        ];
    }
}
