<?php

namespace App\Http\Requests\Payment;

use App\Rules\BeninPhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

/** Débit mobile money sur un encaissement déjà ouvert. */
class MobileMoneyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // `authorizedPayment()` vérifie l'appartenance dans le contrôleur.
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_id' => 'required|school_exists:payments,id',
            'phone_number' => ['required', 'string', new BeninPhoneNumber],
            'operator' => 'required|in:mtn,moov',
        ];
    }
}
