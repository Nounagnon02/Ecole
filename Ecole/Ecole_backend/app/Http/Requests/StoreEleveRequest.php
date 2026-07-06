<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEleveRequest extends FormRequest
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
            'date_naissance' => 'required|date',
            'lieu_naissance' => 'nullable|string|max:255',
            'sexe' => 'required|in:M,F',
            'classe_id' => 'required|exists:classes,id',
            'matricule' => 'required|string|unique:eleves,matricule',
            'email' => 'nullable|email|max:255|unique:users,email',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
            'tuteur_nom' => 'nullable|string|max:255',
            'tuteur_telephone' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'élève est requis.',
            'prenom.required' => 'Le prénom de l\'élève est requis.',
            'date_naissance.required' => 'La date de naissance est requise.',
            'sexe.in' => 'Le sexe doit être M ou F.',
            'classe_id.required' => 'La classe est requise.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'matricule.required' => 'Le matricule est requis.',
            'matricule.unique' => 'Ce matricule est déjà utilisé.',
            'email.unique' => 'Cet email est déjà utilisé.',
        ];
    }
}
