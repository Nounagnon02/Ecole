<?php

namespace App\Http\Middleware;

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
     * Bloque l'accès si la 2FA est activée mais pas encore vérifiée.
     *
     * Deux modes d'authentification coexistent :
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

        if (!$user || !$user->two_factor_enabled) {
            return $next($request);
        }

        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            // Requête stateless authentifiée par Bearer : seul compte le token.
            if (
                in_array('2fa:pending', $token->abilities, true)
                && !$this->pathAllowed($request)
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

    private function pathAllowed(Request $request): bool
    {
        foreach (self::PENDING_ALLOWED_PATHS as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
