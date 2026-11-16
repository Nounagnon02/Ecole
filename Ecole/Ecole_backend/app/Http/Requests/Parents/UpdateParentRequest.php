<?php

namespace App\Http\Requests\Parents;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Mise à jour d'un compte parent (route `/parents/{id}`).
 *
 * L'unicité de l'email exclut l'utilisateur courant : elle a besoin du
 * `UserParent` déjà résolu par le contrôleur, pas seulement de l'id de la
 * route — construite ici depuis le paramètre de route.
 */
class UpdateParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        $parent = \App\Models\UserParent::findOrFail($this->route('id'));

        return [
            'name' => 'sometimes|string',
            'prenom' => 'sometimes|string',
            'email' => 'sometimes|nullable|email|unique:users,email,' . $parent->user_id,
            'telephone' => 'sometimes|string',
            'eleve_ids' => 'sometimes|array',
            'eleve_ids.*' => 'school_exists:eleves,id',
        ];
    }
}
