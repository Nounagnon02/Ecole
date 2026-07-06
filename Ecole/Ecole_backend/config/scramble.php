<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    /*
    |--------------------------------------------------------------------------
    | API Documentation Settings
    |--------------------------------------------------------------------------
    |
    | Scramble generates OpenAPI (Swagger) documentation for your API.
    |
    */

    'api_path' => 'docs/api',
    'info' => [
        'title' => 'École API — Système de Gestion Scolaire',
        'description' => 'API RESTful complète pour la plateforme de gestion scolaire multi-tenant École.',
        'version' => '1.0.0',
    ],

    /*
    |--------------------------------------------------------------------------
    | Servers
    |--------------------------------------------------------------------------
    |
    */

    'servers' => [
        [
            'url' => env('APP_URL'),
            'description' => 'Serveur principal',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | Define global authentication methods for the API.
    |
    */

    'auth' => [
        'bearer' => [
            'type' => 'http',
            'scheme' => 'bearer',
            'description' => 'Authentification par token Sanctum',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    |
    */

    'middleware' => [
        'web',
        RestrictedDocsAccess::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Expand components
    |--------------------------------------------------------------------------
    |
    | When true, enables the expansion of schema components in the generated
    | documentation for better readability.
    |
    */

    'expand_components' => true,
];
