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

    // Préfixe des routes à documenter — pas l'URL de la page de documentation.
    // `docs/api` ne correspondait à aucune route : le document sortait vide.
    'api_path' => 'api',
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

    // Format attendu par Scramble : `description => url`. Une liste de tableaux
    // (`[['url' => …, 'description' => …]]`) fait planter la génération —
    // `url($tableau)` lève une TypeError — donc ni `scramble:export` ni la page
    // /docs/api ne produisaient de document.
    'servers' => [
        'Serveur principal' => env('APP_URL'),
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
