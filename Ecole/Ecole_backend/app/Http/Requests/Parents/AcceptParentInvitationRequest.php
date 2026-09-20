<?php

namespace App\Http\Requests\Parents;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Création du compte parent depuis une invitation acceptée (route publique).
 */
class AcceptParentInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route publique : c'est le jeton d'invitation, vérifié dans le
        // contrôleur, qui autorise cette création — pas un rôle.
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
            'name' => 'required|string',
            'prenom' => 'required|string',
            'telephone' => 'nullable|string',
        ];
    }
}
