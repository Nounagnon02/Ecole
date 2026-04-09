<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!in_array($request->user()->role, $roles)) {
            // Optionnel: Autoriser les admins à tout voir
            if ($request->user()->isAdmin()) {
                return $next($request);
            }
            
            return response()->json(['message' => 'Unauthorized - Role required: ' . implode(', ', $roles)], 403);
        }

        return $next($request);
    }
}
