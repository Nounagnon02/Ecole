<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEleveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $eleveId = $this->route('eleve')?->id ?? $this->route('id');

        return [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'date_naissance' => 'sometimes|date',
            'lieu_naissance' => 'nullable|string|max:255',
            'sexe' => 'sometimes|in:M,F',
            'classe_id' => 'sometimes|exists:classes,id',
            'matricule' => ['sometimes', 'string', Rule::unique('eleves', 'matricule')->ignore($eleveId)],
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:20',
            'adresse' => 'nullable|string',
            'tuteur_nom' => 'nullable|string|max:255',
            'tuteur_telephone' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'sexe.in' => 'Le sexe doit être M ou F.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'matricule.unique' => 'Ce matricule est déjà utilisé.',
        ];
    }
}
