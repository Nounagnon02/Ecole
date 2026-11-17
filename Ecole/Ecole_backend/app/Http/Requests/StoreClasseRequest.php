<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom_classe' => 'required|string|max:255',
            'categorie_classe' => 'required|in:Maternelle,Primaire,Secondaire',
            'capacite_max' => 'nullable|integer|min:1',
        ];
    }
}
