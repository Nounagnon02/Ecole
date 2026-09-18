<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Identifiants de connexion.
 *
 * Le contrat est ambigu par héritage : le champ s'appelle `email` mais accepte
 * aussi un identifiant — l'interface le libelle « Email ou identifiant » — et
 * beaucoup de comptes n'ont pas d'adresse, la colonne étant nullable. Les deux
 * noms sont acceptés, l'un ou l'autre suffit. Cette subtilité mérite d'être
 * déclarée une fois, à un endroit nommé, plutôt que répétée en ligne.
 */
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route publique : l'autorisation, c'est la vérification du mot de passe.
        return true;
    }

    public function rules(): array
    {
        return [
            'email'       => 'required_without:identifiant|nullable|string',
            'identifiant' => 'required_without:email|nullable|string',
            'password'    => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ];
    }

    /** L'identifiant effectivement fourni, quel que soit le champ utilisé. */
    public function login(): string
    {
        return (string) ($this->input('identifiant') ?: $this->input('email'));
    }
}
