<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'montant' => 'required|numeric|min:0',
            'type' => 'required|in:frais_scolarite,inscription,tenue,transport,autre',
            'mode_paiement' => 'required|in:espece,cheque,virement,mobile_money,carte',
            'reference' => 'nullable|string|max:255',
            'date_paiement' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'eleve_id.required' => 'L\'élève est requis.',
            'montant.required' => 'Le montant est requis.',
            'montant.min' => 'Le montant doit être positif.',
            'type.required' => 'Le type de paiement est requis.',
            'type.in' => 'Type de paiement invalide.',
            'mode_paiement.required' => 'Le mode de paiement est requis.',
            'mode_paiement.in' => 'Mode de paiement invalide.',
            'date_paiement.required' => 'La date de paiement est requise.',
        ];
    }
}
