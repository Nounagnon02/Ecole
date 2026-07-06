<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'matiere_id' => 'required|exists:matieres,id',
            'valeur' => 'required|numeric|min:0|max:20',
            'valeur_sur' => 'sometimes|numeric|min:1|max:20',
            'periode_id' => 'nullable|exists:periodes,id',
            'type_evaluation_id' => 'nullable|exists:type_evaluations,id',
            'date' => 'required|date',
            'appreciation' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'eleve_id.required' => 'L\'élève est requis.',
            'eleve_id.exists' => 'L\'élève sélectionné n\'existe pas.',
            'matiere_id.required' => 'La matière est requise.',
            'matiere_id.exists' => 'La matière sélectionnée n\'existe pas.',
            'valeur.required' => 'La note est requise.',
            'valeur.min' => 'La note doit être au minimum 0.',
            'valeur.max' => 'La note doit être au maximum 20.',
            'date.required' => 'La date est requise.',
        ];
    }
}
