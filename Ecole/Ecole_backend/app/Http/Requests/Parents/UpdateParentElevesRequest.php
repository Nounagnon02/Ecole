<?php

namespace App\Http\Requests\Parents;

use App\Models\ParentEleve;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Liaison/révocation des enfants d'un parent (route `/parents/{id}/eleves`).
 */
class UpdateParentElevesRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur` (routes/api/users.php).
        return true;
    }

    public function rules(): array
    {
        return [
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
