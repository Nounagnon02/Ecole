<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EcoleScope
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user) {
            return $next($request);
        }

        // Un utilisateur rattaché à un établissement est verrouillé dessus.
        // L'en-tête X-Ecole-Id était auparavant recopié en session sans aucune
        // vérification d'appartenance (cf. audit S13).
        if ($user->ecole_id) {
            session(['ecole_id' => $user->ecole_id]);

            return $next($request);
        }

        // Utilisateur sans école propre (super-admin plateforme) : lui seul
        // peut cibler un établissement via l'en-tête.
        $demande = $request->header('X-Ecole-Id');

        if ($demande && $user->role === 'super-admin') {
            session(['ecole_id' => (int) $demande]);
        }

        return $next($request);
    }
}
