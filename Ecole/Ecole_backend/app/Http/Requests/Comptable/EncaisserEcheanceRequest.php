<?php

namespace App\Http\Requests\Comptable;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Versement reçu au guichet sur une échéance existante.
 *
 * Le plafond (ne pas encaisser plus que le reste dû) est vérifié dans le
 * contrôleur, sous verrou : il dépend de l'état de l'échéance au moment de
 * l'écriture, pas de la forme de la requête.
 */
class EncaisserEcheanceRequest extends FormRequest
{
    /** Modes qu'un agent peut constater lui-même. La carte passe par la passerelle. */
    public const MODES = ['ESPECES', 'CHEQUE', 'VIREMENT', 'MOBILE_MONEY'];

    public function authorize(): bool
    {
        return true; // le groupe de routes impose `role:directeur,comptable`
    }

    public function rules(): array
    {
        return [
            'montant' => 'required|numeric|min:1',
            'mode_paiement' => 'required|in:'.implode(',', self::MODES),
            'date_paiement' => 'nullable|date|before_or_equal:today',
            'reference' => 'nullable|string|max:255',
            'observation' => 'nullable|string|max:500',
        ];
    }
}
