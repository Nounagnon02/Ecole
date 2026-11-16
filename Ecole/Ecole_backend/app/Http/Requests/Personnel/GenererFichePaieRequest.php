<?php

namespace App\Http\Requests\Personnel;

use Illuminate\Foundation\Http\FormRequest;

class GenererFichePaieRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Le contrôleur vérifie `authorize('update', $personnel)` : cette
        // règle a besoin du modèle résolu depuis le paramètre de route.
        return true;
    }

    public function rules(): array
    {
        return [
            'periode' => 'required|string',
            'primes' => 'nullable|numeric',
            'retenues' => 'nullable|numeric',
        ];
    }
}
