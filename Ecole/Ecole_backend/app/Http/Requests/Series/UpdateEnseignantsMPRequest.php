<?php

namespace App\Http\Requests\Series;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEnseignantsMPRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,admin` (routes/api/series.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'classes' => 'required|array',
            'classes.*.classe_id' => 'required|school_exists:classes,id',
            'classes.*.enseignants' => 'array',
            'classes.*.enseignants.*' => 'school_exists:enseignants_maternelle_primaire,id',
        ];
    }
}
