<?php

namespace App\Http\Requests\Parents;

use App\Models\ParentEleve;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Invitation d'un parent par email pour un élève donné.
 */
class InviteParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Le contrôleur vérifie en plus `authorize('update', $eleve)` : cette
        // règle-ci a besoin du modèle Élève, résolu après validation.
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email',
            'eleve_id' => 'required|school_exists:eleves,id',
            'role' => 'nullable|in:' . implode(',', ParentEleve::ROLES),
            'is_primary' => 'boolean',
            'is_guardian' => 'boolean',
            'expires_in_days' => 'nullable|integer|min:1|max:30',
        ];
    }
}
