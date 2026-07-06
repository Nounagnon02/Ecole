<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * BaseRequest — Classe de base pour les Form Requests
 *
 * Étend FormRequest avec :
 * - Gestion d'erreurs unifiée (toujours JSON)
 * - Filtrage automatique des attributs nuls
 * - Méthodes helper pour les permissions courantes
 */
class BaseRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Gestion des erreurs de validation en JSON
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    /**
     * Nettoie les champs nuls avant validation
     */
    protected function prepareForValidation(): void
    {
        $this->replace(
            collect($this->all())->filter(fn ($value) => $value !== null)->toArray()
        );
    }

    /**
     * Vérifie que l'utilisateur a un rôle spécifique
     */
    protected function userHasRole(string $role): bool
    {
        return $this->user()?->role === $role;
    }

    /**
     * Vérifie que l'utilisateur a au moins un des rôles
     */
    protected function userHasAnyRole(array $roles): bool
    {
        return in_array($this->user()?->role, $roles);
    }
}
