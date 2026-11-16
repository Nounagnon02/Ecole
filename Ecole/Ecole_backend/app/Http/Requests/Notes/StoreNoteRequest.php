<?php

namespace App\Http\Requests\Notes;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Saisie d'une note.
 *
 * Les valeurs admises de `type_evaluation` et `periode` sont le contrat que
 * partagent la saisie, l'import CSV et le calcul des bulletins. Les tenir ici
 * évite qu'une des trois surfaces dérive sans que les autres le sachent.
 */
class StoreNoteRequest extends FormRequest
{
    public const TYPES_EVALUATION = [
        'Devoir1', 'Devoir2', 'Interrogation',
        '1ère evaluation', '2ème evaluation', '3ème evaluation',
        '4ème evaluation', '5ème evaluation', '6ème evaluation',
    ];

    public const PERIODES = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];

    public function authorize(): bool
    {
        // La route est gardée par `role:directeur,enseignant`, et le
        // contrôleur vérifie que l'enseignant est bien affecté à la classe.
        return true;
    }

    public function rules(): array
    {
        return [
            'eleve_id'        => 'required|school_exists:eleves,id',
            'classe_id'       => 'required|school_exists:classes,id',
            'matiere_id'      => 'required|school_exists:matieres,id',
            'note'            => 'required|numeric|min:0|max:20',
            'note_sur'        => 'required|numeric|min:1|max:20',
            'type_evaluation' => 'required|in:' . implode(',', self::TYPES_EVALUATION),
            'date_evaluation' => 'required|date',
            'periode'         => 'required|in:' . implode(',', self::PERIODES),
            'annee_scolaire'  => 'nullable|string|regex:/^\d{4}-\d{4}$/',
            'observation'     => 'nullable|string|max:500',
        ];
    }

    /**
     * Conserver la forme d'erreur du contrôleur d'origine.
     *
     * `Validator::make()` renvoyait ici `{success: false, message, errors}`,
     * pas l'enveloppe `{message, errors}` de Laravel. Le front distingue ses
     * cas sur `success` : extraire la validation ne doit pas changer ce que
     * reçoit l'appelant.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Données invalides',
            'errors'  => $validator->errors(),
        ], 422));
    }
}
