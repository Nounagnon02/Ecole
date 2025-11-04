<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EcoleScope
{
    public function handle(Request $request, Closure $next)
    {
        // Priorité 1: Header X-Ecole-Id
        if ($request->header('X-Ecole-Id')) {
            session(['ecole_id' => $request->header('X-Ecole-Id')]);
        }
        // Priorité 2: User authentifié
        elseif (auth()->check() && auth()->user()->ecole_id) {
            session(['ecole_id' => auth()->user()->ecole_id]);
        }

        return $next($request);
    }
}
