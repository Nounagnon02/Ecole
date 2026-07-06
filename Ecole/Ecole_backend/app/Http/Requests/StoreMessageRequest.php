<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sujet' => 'required|string|max:255',
            'contenu' => 'required|string',
            'destinataires' => 'required|array',
            'destinataires.*' => 'exists:users,id',
            'pieces_jointes' => 'nullable|array',
            'pieces_jointes.*' => 'file|max:10240|mimes:pdf,jpg,png,doc,docx',
        ];
    }

    public function messages(): array
    {
        return [
            'sujet.required' => 'Le sujet est requis.',
            'contenu.required' => 'Le contenu est requis.',
            'destinataires.required' => 'Au moins un destinataire est requis.',
            'destinataires.*.exists' => 'Destinataire invalide.',
        ];
    }
}
