<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClasseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'nom_classe' => 'required|string|max:255',
            'categorie_classe' => 'required|string|in:Maternelle,Primaire,Secondaire',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'nom_classe.required' => 'Le nom de la classe est requis.',
            'categorie_classe.required' => 'La catégorie de la classe est requise.',
            'categorie_classe.in' => 'La catégorie doit être Maternelle, Primaire ou Secondaire.',
        ];
    }
}
