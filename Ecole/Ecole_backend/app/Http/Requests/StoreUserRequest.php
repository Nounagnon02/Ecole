<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'telephone' => 'nullable|string|max:20',
            'password' => ['required', 'string', Password::defaults()],
            'role' => 'required|string|in:directeur,enseignant,eleve,parent,comptable,secretaire,surveillant,censeur,infirmier,bibliothecaire',
            'ecole_id' => 'required|exists:ecoles,id',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis.',
            'prenom.required' => 'Le prénom est requis.',
            'email.required' => 'L\'email est requis.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'password.required' => 'Le mot de passe est requis.',
            'role.required' => 'Le rôle est requis.',
            'role.in' => 'Ce rôle n\'est pas valide.',
            'ecole_id.required' => 'L\'école est requise.',
        ];
    }
}
