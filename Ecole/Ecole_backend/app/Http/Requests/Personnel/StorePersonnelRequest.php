<?php

namespace App\Http\Requests\Personnel;

use Illuminate\Foundation\Http\FormRequest;

class StorePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Personnel::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'prenom' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'identifiant' => 'required|string|unique:users,identifiant',
            'password' => 'required|string|min:8',
            'poste' => 'required|string',
            'salaire_base' => 'required|numeric',
            'date_embauche' => 'required|date',
            'type_contrat' => 'required|in:CDI,CDD,Stage',
        ];
    }
}
