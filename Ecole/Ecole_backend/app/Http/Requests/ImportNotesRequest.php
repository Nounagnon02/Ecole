<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => 'required|array|min:1',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.matiere_id' => 'required|exists:matieres,id',
            'notes.*.valeur' => 'required|numeric|min:0|max:20',
            'notes.*.periode_id' => 'nullable|exists:periodes,id',
            'notes.*.type_evaluation_id' => 'nullable|exists:type_evaluations,id',
            'notes.*.date' => 'sometimes|date',
            'notes.*.appreciation' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'notes.required' => 'La liste des notes est requise.',
            'notes.min' => 'Au moins une note est requise.',
            'notes.*.eleve_id.required' => 'L\'ID élève est requis pour chaque note.',
            'notes.*.matiere_id.required' => 'L\'ID matière est requis pour chaque note.',
            'notes.*.valeur.required' => 'La valeur est requise pour chaque note.',
        ];
    }
}
