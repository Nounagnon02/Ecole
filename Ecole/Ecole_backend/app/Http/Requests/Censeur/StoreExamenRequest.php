<?php

namespace App\Http\Requests\Censeur;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamenRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,censeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'type' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'classes' => 'array',
            'matieres' => 'array',
            'statut' => 'string|in:planifie,en_cours,termine',
        ];
    }
}
