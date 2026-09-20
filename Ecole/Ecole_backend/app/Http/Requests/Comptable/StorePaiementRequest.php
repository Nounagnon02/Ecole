<?php

namespace App\Http\Requests\Comptable;

use App\Support\Reglement;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Enregistrement direct d'un paiement par le comptable.
 *
 * `school_exists` plutôt que `exists` : la règle native de Laravel ne voit
 * pas le scope tenant — elle confirmerait l'existence d'un élève ou d'un
 * parent d'une autre école (cf. App\Validation\SchoolExistsRule).
 *
 * La vérification que `parents_id`, s'il est fourni, nomme bien un parent
 * *lié à cet élève* reste dans le contrôleur : elle a besoin du modèle
 * `Eleve` déjà chargé et dérive `parents_id` quand il est absent, ce qui
 * dépasse la validation de forme.
 */
class StorePaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id'      => 'required|school_exists:eleves,id',
            'montant'       => 'required|numeric|min:0',
            'type_paiement' => 'required|string|max:255',
            // NOT NULL en base, et une écriture comptable sans mode de
            // règlement n'est pas rapprochable.
            'mode_paiement' => Reglement::regleMode(),
            'date_paiement' => 'required|date',
            'reference'     => 'nullable|string|max:255',
            'parents_id'    => 'nullable|school_exists:parents,id',
        ];
    }
}
