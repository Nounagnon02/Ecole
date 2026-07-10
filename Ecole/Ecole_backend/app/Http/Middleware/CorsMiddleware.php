<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request — ajoute les headers CORS
     * et coupe les requêtes OPTIONS (preflight).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin', '*');

        // Heads CORS pour toutes les réponses
        $headers = [
            'Access-Control-Allow-Origin'      => $origin,
            'Access-Control-Allow-Methods'     => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers'     => 'Content-Type, X-Requested-With, X-XSRF-TOKEN, Accept, Authorization, X-Ecole-Id',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
            'Vary'                             => 'Origin',
        ];

        // Preflight OPTIONS — retour immédiat
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)->withHeaders($headers);
        }

        $response = $next($request);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}
