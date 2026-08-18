<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * AccountLockout — bloque temporairement un compte après N tentatives
 * infructueuses (cf. audit AUTH-9).
 *
 * Le compteur est stocké en cache (Redis/Memcached, ou file en dev). Le
 * lockout dure 15 minutes. La connexion réussie remet le compteur à zéro.
 *
 * Le middleware est monté sur la route POST /api/auth/login ; il vérifie
 * l'identifiant (email ou identifiant) fourni dans la requête AVANT
 * l'authentification, et rejette dès que le seuil est atteint.
 */
class AccountLockout
{
    /** Nombre max de tentatives avant lockout. */
    private const MAX_ATTEMPTS = 5;

    /** Durée du lockout en minutes. */
    private const LOCKOUT_MINUTES = 15;

    public function handle(Request $request, Closure $next): Response
    {
        $login = strtolower(trim(
            (string) ($request->input('email') ?: $request->input('identifiant'))
        ));

        if ($login === '') {
            return $next($request);
        }

        $key = 'login_attempts:' . $login;
        $attempts = (int) Cache::get($key, 0);

        if ($attempts >= self::MAX_ATTEMPTS) {
            $ttl = Cache::store('file')->has($key)
                ? 'quelques minutes'
                : self::LOCKOUT_MINUTES . ' minutes';

            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$ttl}.",
            ], 429);
        }

        /** @var Response $response */
        $response = $next($request);

        // Si la connexion a échoué (401), incrémenter le compteur.
        if ($response->getStatusCode() === 401) {
            Cache::put($key, $attempts + 1, now()->addMinutes(self::LOCKOUT_MINUTES));
        }

        return $response;
    }

    /**
     * Réinitialise le compteur après une connexion réussie.
     *
     * Appelé depuis AuthController::connexion après un login réussi.
     */
    public static function clearForLogin(string $login): void
    {
        Cache::forget('login_attempts:' . strtolower(trim($login)));
    }
}
