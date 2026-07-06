<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EcoleScope
{
    public function handle(Request $request, Closure $next)
    {
        // X-Ecole-Id header accepté seulement pour les utilisateurs authentifiés
        if ($request->header('X-Ecole-Id') && auth()->check()) {
            session(['ecole_id' => $request->header('X-Ecole-Id')]);
        }
        // Sinon, utiliser l'ecole_id de l'utilisateur connecté
        elseif (auth()->check() && auth()->user()->ecole_id) {
            session(['ecole_id' => auth()->user()->ecole_id]);
        }

        return $next($request);
    }
}
