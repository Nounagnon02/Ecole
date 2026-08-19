<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyTwoFactor
{
    /**
     * Bloque l'accès si la 2FA est activée mais pas encore vérifiée dans la session.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->two_factor_enabled && !$request->session()->get('two_factor_verified')) {
            return response()->json([
                'message' => 'Vérification 2FA requise',
                'requires_2fa' => true,
            ], 403);
        }

        return $next($request);
    }
}
