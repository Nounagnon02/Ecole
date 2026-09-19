<?php

namespace App\Http\Requests\Enseignant;

use App\Support\Roles;
use Illuminate\Foundation\Http\FormRequest;

class StoreEnseignantRequest extends FormRequest
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
            'role' => 'required|in:' . implode(',', Roles::teachers()),
        ];
    }
}
