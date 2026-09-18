<?php

namespace App\Http\Requests\Comptable;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Enregistrement d'une dépense de l'établissement.
 */
class StoreDepenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Le middleware de rôle (`role:comptable,directeur,admin`) garde déjà
        // la route ; aucune vérification supplémentaire par ressource.
        return true;
    }

    public function rules(): array
    {
        return [
            'categorie' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'montant' => 'required|numeric|min:0.01',
            'date_depense' => 'required|date',
        ];
    }
}
