<?php

namespace App\Http\Requests\Series;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEnseignantsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La route est déjà gardée par `role:directeur,admin` (routes/api/series.php).
        return true;
    }

    public function rules(): array
    {
        return [
            'matieres' => 'required|array',
            'matieres.*.classe_id' => 'required|school_exists:classes,id',
            'matieres.*.serie_id' => 'required|school_exists:series,id',
            'matieres.*.matiere_id' => 'required|school_exists:matieres,id',
            'matieres.*.enseignants' => 'array',
            'matieres.*.enseignants.*' => 'school_exists:enseignants,id',
        ];
    }
}
