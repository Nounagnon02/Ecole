<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
   
     public function handle($request, Closure $next)
    {
        // Gestion spéciale des requêtes OPTIONS
        if ($request->isMethod('OPTIONS')) {
            return response()->noContent()
                ->header('Access-Control-Allow-Origin', implode(',', config('cors.allowed_origins')))
                ->header('Access-Control-Allow-Methods', implode(',', config('cors.allowed_methods')))
                ->header('Access-Control-Allow-Headers', $request->header('Access-Control-Request-Headers') ?? '*')
                ->header('Access-Control-Allow-Credentials', 'true');

            Log::info('CORS OPTIONS request', [
            'request' => $request->all(),
            'response' => $response->all(),
            ]);
        }

         $response = $next($request);

            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token, Origin, Authorization');
            $response->headers->set('Access-Control-Expose-Headers', 'Authorization');

            return $response;
    }
}
