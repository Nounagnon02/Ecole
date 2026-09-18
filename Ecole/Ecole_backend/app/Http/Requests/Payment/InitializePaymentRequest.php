<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Ouverture d'un encaissement.
 *
 * `school_exists` plutôt que `exists` : la règle native de Laravel travaille
 * sur le query builder brut et ne voit donc pas le scope tenant — elle
 * confirmerait l'existence d'un élève d'un autre établissement
 * (cf. App\Validation\SchoolExistsRule).
 */
class InitializePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Le droit d'agir sur cet élève est vérifié dans le contrôleur
        // (`canAccessStudent`), qui distingue gestionnaire, parent et élève.
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id'          => 'required|school_exists:eleves,id',
            'paiement_eleve_id' => 'nullable|school_exists:paiements,id',
            'amount'            => 'required|numeric|min:100',
            'description'       => 'required|string',
            'type'              => 'required|in:scolarite,cantine,transport,autre',
            'periode'           => 'nullable|string',
        ];
    }
}
