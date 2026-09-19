<?php

namespace App\Http\Requests\Censeur;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamenRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,censeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date|after_or_equal:date_debut',
            'classes' => 'sometimes|array',
            'matieres' => 'sometimes|array',
            'statut' => 'sometimes|string|in:planifie,en_cours,termine',
        ];
    }
}
