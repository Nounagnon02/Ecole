<?php

namespace App\Http\Requests\Parents;

use App\Models\ParentEleve;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Création d'un compte parent par un directeur.
 */
class StoreParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:8',
            'ecole_id' => 'required|exists:ecoles,id',
            'telephone' => 'nullable|string',
            'eleve_ids' => 'sometimes|array',
            'eleve_ids.*' => 'school_exists:eleves,id',
            'liens' => 'sometimes|array',
            'liens.*.eleve_id' => 'required|school_exists:eleves,id',
            'liens.*.role' => 'sometimes|nullable|in:' . implode(',', ParentEleve::ROLES),
            'liens.*.is_primary' => 'sometimes|boolean',
            'liens.*.is_guardian' => 'sometimes|boolean',
        ];
    }
}
