<?php

namespace App\Http\Middleware;

use App\Support\Roles;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class VerifyTwoFactor
{
    /**
     * Seules routes qu'un token « en attente de 2FA » est autorisé à
     * atteindre : l'endpoint qui échange ce token contre un token complet
     * une fois le code TOTP validé. Le motif est relatif au préfixe de
     * montage (« api/... », « api/v1/... »).
     */
    private const PENDING_ALLOWED_PATHS = ['*/auth/2fa/verify-login'];

    /**
     * Seules routes qu'un rôle à 2FA obligatoire mais pas encore activée
     * peut atteindre : celles qui lui permettent de finir l'enrôlement (voir
     * TwoFactorCard, frontend), plus se voir et se déconnecter. Tout le
     * reste de l'API lui reste fermé tant que la 2FA n'est pas active.
     */
    private const MANDATORY_SETUP_ALLOWED_PATHS = [
        '*/auth/2fa/setup',
        '*/auth/2fa/verify',
        '*/auth/me',
        '*/auth/logout',
    ];

    /**
     * Bloque l'accès si la 2FA est activée mais pas encore vérifiée, ou si
     * le rôle l'exige et qu'elle n'est pas encore activée du tout.
     *
     * Deux modes d'authentification coexistent pour la vérification déjà en
     * place :
     *  - token porteur stateless (mobile & clients non-stateful) : le jeton
     *    temporaire émis à la connexion porte l'ability « 2fa:pending » ;
     *    tant qu'il n'a pas été échangé, il ne doit rien atteindre d'autre.
     *    La lecture se fait sur le tableau brut des abilities — tokenCan()
     *    renverrait aussi vrai pour les tokens complets (« * »), ce qui
     *    neutraliserait le contrôle ;
     *  - session stateful (SPA sur cookie httpOnly) : contrôle par flag
     *    posé lors de la validation réussie du code TOTP.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Rôle à 2FA obligatoire (comptable, directeur, admin, super-admin —
        // voir Roles::requiresTwoFactor()) mais jamais encore activée :
        // cantonné aux routes d'enrôlement, comme un token « en attente »
        // l'est à l'échange. Distinct de `requires_2fa` (code à saisir) —
        // ici il n'y a même pas encore de secret : `requires_2fa_setup`
        // dit au frontend d'ouvrir l'écran d'activation, pas de challenge.
        if (!$user->two_factor_enabled) {
            if (Roles::requiresTwoFactor($user->role) && !$this->pathAllowed($request, self::MANDATORY_SETUP_ALLOWED_PATHS)) {
                return response()->json([
                    'message' => 'Authentification à deux facteurs obligatoire pour ce rôle',
                    'requires_2fa_setup' => true,
                ], 403);
            }

            return $next($request);
        }

        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            // Requête stateless authentifiée par Bearer : seul compte le token.
            if (
                in_array('2fa:pending', $token->abilities, true)
                && !$this->pathAllowed($request, self::PENDING_ALLOWED_PATHS)
            ) {
                return response()->json([
                    'message' => 'Vérification 2FA requise',
                    'requires_2fa' => true,
                ], 403);
            }

            return $next($request);
        }

        // Requête stateful authentifiée par session (pas de token porteur).
        if ($request->hasSession()
            && !$request->session()->get('two_factor_verified')) {
            return response()->json([
                'message' => 'Vérification 2FA requise',
                'requires_2fa' => true,
            ], 403);
        }

        return $next($request);
    }

    private function pathAllowed(Request $request, array $allowedPaths): bool
    {
        foreach ($allowedPaths as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
