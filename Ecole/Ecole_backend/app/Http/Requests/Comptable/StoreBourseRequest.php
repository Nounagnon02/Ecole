<?php

namespace App\Http\Requests\Comptable;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Attribution d'une bourse à un élève.
 */
class StoreBourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id' => 'required|school_exists:eleves,id',
            'type_bourse' => 'required|string',
            'montant' => 'required|numeric',
            'pourcentage' => 'required|integer',
            'periode' => 'required|string',
        ];
    }
}
