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
        // Pas de `ecole_id` : ce champ venait du corps de la requête et
        // n'était vérifié que contre la table `ecoles` (n'importe quel
        // établissement), sans égard à celle de l'appelant — un directeur
        // pouvait créer un compte enseignant dans l'école de son choix. Le
        // contrôleur le fixe désormais sur l'école de l'appelant.
        return [
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:8',
            'role' => 'required|in:' . implode(',', Roles::teachers()),
        ];
    }
}
