<?php

namespace App\Http\Requests\Enseignant;

use App\Support\Roles;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEnseignantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $enseignant = \App\Models\Enseignant::with('user')->findOrFail($this->route('id'));

        return [
            'name'    => 'sometimes|string|max:255',
            'prenom'  => 'sometimes|string|max:255',
            'email'   => 'sometimes|nullable|email|unique:users,email,' . $enseignant->user->id,
            'role'    => 'sometimes|in:' . implode(',', Roles::teachers()),
        ];
    }
}
