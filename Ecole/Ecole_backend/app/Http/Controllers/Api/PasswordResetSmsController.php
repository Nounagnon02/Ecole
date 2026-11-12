<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SmsService;
use App\Support\BeninPhone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Mot de passe oublié par SMS (lot 7.3).
 *
 * La réinitialisation n'existait que par courriel, que beaucoup de parents
 * n'ont pas ou ne lisent pas. Un code à six chiffres est envoyé au numéro du
 * compte ; valable 15 minutes, cinq essais.
 */
class PasswordResetSmsController extends Controller
{
    private const DUREE_MINUTES = 15;

    private const ESSAIS = 5;

    public function envoyer(Request $request, SmsService $sms)
    {
        $request->validate(['telephone' => 'required|string|max:30']);

        $compte = $this->compte($request->input('telephone'));

        if ($compte) {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            Cache::put($this->cle($compte), ['hachage' => Hash::make($code), 'essais' => 0], now()->addMinutes(self::DUREE_MINUTES));
            $sms->send((string) ($compte->telephone ?: $request->input('telephone')),
                "Votre code de réinitialisation : {$code}. Valable ".self::DUREE_MINUTES.' minutes. Ne le communiquez à personne.');
        }

        // Même réponse que le numéro soit connu ou non : on ne révèle pas qui
        // a un compte.
        return response()->json(['message' => 'Si ce numéro correspond à un compte, un code vient d’être envoyé par SMS.']);
    }

    public function confirmer(Request $request)
    {
        $donnees = $request->validate([
            'telephone' => 'required|string|max:30',
            'code' => 'required|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $compte = $this->compte($donnees['telephone']);
        $etat = $compte ? Cache::get($this->cle($compte)) : null;

        if (! $etat || $etat['essais'] >= self::ESSAIS) {
            return response()->json(['message' => 'Code expiré ou invalide. Demandez-en un nouveau.'], 422);
        }

        if (! Hash::check($donnees['code'], $etat['hachage'])) {
            $etat['essais']++;
            Cache::put($this->cle($compte), $etat, now()->addMinutes(self::DUREE_MINUTES));

            return response()->json(['message' => 'Code incorrect.', 'errors' => ['code' => ['Code incorrect.']]], 422);
        }

        Cache::forget($this->cle($compte));
        $compte->forceFill(['password' => Hash::make($donnees['password']), 'password_change_required' => false])->save();
        $compte->tokens()->delete();

        return response()->json(['message' => 'Mot de passe modifié. Vous pouvez vous connecter.']);
    }

    private function compte(string $telephone): ?User
    {
        $variantes = BeninPhone::variantes($telephone);

        if (! $variantes) {
            return null;
        }

        return User::withoutGlobalScopes()
            ->where(fn ($q) => $q->whereIn('identifiant', $variantes)->orWhereIn('telephone', $variantes))
            ->where('is_active', true)
            ->first();
    }

    private function cle(User $compte): string
    {
        return 'reinitialisation-sms:'.$compte->id;
    }
}
