<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Vérifier si l'utilisateur est super admin
        if (!auth()->check() || auth()->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return $next($request);
    }
}
