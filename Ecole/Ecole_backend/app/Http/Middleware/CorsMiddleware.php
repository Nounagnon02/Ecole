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

        // Applique les headers CORS
        $response->headers->set('Access-Control-Allow-Origin', implode(',', config('cors.allowed_origins')));
        $response->headers->set('Access-Control-Allow-Methods', implode(',', config('cors.allowed_methods')));
        $response->headers->set('Access-Control-Allow-Headers', '*');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
