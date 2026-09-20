<?php

namespace App\Http\Requests\Series;

use Illuminate\Foundation\Http\FormRequest;

class SyncMatieresRequest extends FormRequest
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
            'matieres.*.matiere_id' => 'required|school_exists:matieres,id',
            'matieres.*.classe_id' => 'required|school_exists:classes,id',
            'matieres.*.coefficient' => 'required|numeric|min:0.1|max:10',
        ];
    }
}
