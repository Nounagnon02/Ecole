<?php

namespace App\Http\Requests\Censeur;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConseilClasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,censeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'classe_id' => 'sometimes|school_exists:classes,id',
            'date' => 'sometimes|date',
            'trimestre' => 'sometimes|string',
            'participants' => 'sometimes|array',
            'decisions' => 'sometimes|array',
            'statut' => 'sometimes|string|in:planifie,en_cours,termine',
        ];
    }
}
