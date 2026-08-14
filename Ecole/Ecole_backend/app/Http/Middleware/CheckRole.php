<?php

namespace App\Http\Middleware;

use App\Support\Roles;
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

        $role = $request->user()->role;

        // Le super-admin plateforme est le seul rôle transverse. `directeur` ne
        // l'est PAS : sinon il contournerait role:comptable, role:infirmier,
        // role:super-admin, etc. (cf. audit S1).
        if ($role === Roles::SUPER_ADMIN) {
            return $next($request);
        }

        // `role:directeur` admits the cycle heads (directeurM/P/S). They are
        // provisioned for every school by SchoolProvision, and no route named
        // them, so those accounts could not reach a single endpoint.
        if (!Roles::satisfies($role, $roles)) {
            return response()->json(['message' => 'Unauthorized - Role required: ' . implode(', ', $roles)], 403);
        }

        return $next($request);
    }
}
