<?php

namespace App\Http\Requests\Censeur;

use Illuminate\Foundation\Http\FormRequest;

class StoreConseilClasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,censeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'classe_id' => 'required|school_exists:classes,id',
            'date' => 'required|date',
            'trimestre' => 'required|string',
            'participants' => 'array',
            'decisions' => 'array',
            'statut' => 'string|in:planifie,en_cours,termine',
        ];
    }
}
