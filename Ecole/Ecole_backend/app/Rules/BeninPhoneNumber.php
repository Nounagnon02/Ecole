<?php

namespace App\Rules;

use App\Support\BeninPhone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Numéro de téléphone béninois : 01 suivi de 8 chiffres, avec ou sans
 * indicatif +229. Les anciens numéros à 8 chiffres restent acceptés.
 *
 * Les formulaires se contentaient de `string` : un numéro mal saisi partait
 * tel quel chez l'opérateur de paiement ou chez le fournisseur de SMS.
 */
class BeninPhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! BeninPhone::isValid($value)) {
            $fail('Le numéro de téléphone doit compter 10 chiffres et commencer par 01 (exemple : 01 97 12 34 56).');
        }
    }
}
