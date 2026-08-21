<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Webhooks serveur-à-serveur uniquement (signature vérifiée dans les contrôleurs)
        '*/payments/webhook',
        'api/v1/billing/webhook/*',
    ];


    
    
}
