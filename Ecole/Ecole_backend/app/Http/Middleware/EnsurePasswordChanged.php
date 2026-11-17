<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Tant qu'un compte porte un mot de passe provisoire, il ne peut que se voir,
 * se déconnecter et changer ce mot de passe. `requires_password_change` dit au
 * client d'ouvrir l'écran de changement.
 */
class EnsurePasswordChanged
{
    public const ALLOWED_PATHS = ['*/auth/me', '*/auth/logout', '*/auth/change-password'];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->password_change_required && ! $request->is(...self::ALLOWED_PATHS)) {
            return response()->json([
                'message' => 'Vous devez d’abord remplacer votre mot de passe provisoire.',
                'requires_password_change' => true,
            ], 403);
        }

        return $next($request);
    }
}
