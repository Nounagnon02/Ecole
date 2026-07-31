<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Content Security Policy — ressources du même domaine.
        //
        // `script-src` n'accepte plus 'unsafe-inline' ni 'unsafe-eval' en
        // production : ces deux directives annulaient l'essentiel de la
        // protection XSS apportée par la CSP (cf. audit S22). Le build Vite ne
        // produit pas de script inline, donc 'self' suffit. Elles restent
        // tolérées hors production pour le HMR de Vite.
        $scriptSrc = app()->environment('production')
            ? "'self'"
            : "'self' 'unsafe-inline' 'unsafe-eval'";

        $connectSrc = app()->environment('production')
            ? "'self'"
            : "'self' https: ws: wss:";

        $response->headers->set('Content-Security-Policy', implode(' ', [
            "default-src 'self';",
            "script-src {$scriptSrc};",
            // 'unsafe-inline' conservé sur les styles : Tailwind et les
            // styles calculés en ligne des composants en dépendent.
            "style-src 'self' 'unsafe-inline';",
            "img-src 'self' data: https:;",
            "font-src 'self' data:;",
            "connect-src {$connectSrc};",
            "object-src 'none';",
            "base-uri 'self';",
            "form-action 'self';",
            "frame-ancestors 'none';",
        ]));

        // HTTP Strict Transport Security (actif uniquement en production)
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Empêcher le chargement dans un iframe (clickjacking)
        $response->headers->set('X-Frame-Options', 'DENY');

        // Protection XSS navigateur + empêcher le reniflage MIME
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy — désactive les API sensibles
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), fullscreen=(self)');

        return $response;
    }
}
