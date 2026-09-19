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
        // Pas de `ecole_id` : ce champ venait du corps de la requête et
        // n'était vérifié que contre la table `ecoles` (n'importe quel
        // établissement), sans égard à celle de l'appelant — un directeur
        // pouvait créer un compte parent dans l'école de son choix. Le
        // contrôleur le fixe désormais sur l'école de l'appelant.
        return [
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:8',
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
