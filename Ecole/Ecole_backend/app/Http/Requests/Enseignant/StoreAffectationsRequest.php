<?php

namespace App\Http\Requests\Enseignant;

use Illuminate\Foundation\Http\FormRequest;

class StoreAffectationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'affectations' => 'required|array|min:1',
            'affectations.*.classe_id' => 'required|school_exists:classes,id',
            'affectations.*.serie_id' => 'required|school_exists:series,id',
            'affectations.*.matiere_id' => 'required|school_exists:matieres,id',
        ];
    }
}
