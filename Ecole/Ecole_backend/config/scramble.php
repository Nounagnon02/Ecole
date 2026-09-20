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

    // Le préfixe des routes à documenter, pas l'URL de la doc elle-même : la
    // page et le JSON sont toujours servis sur `docs/api`/`docs/api.json`,
    // enregistrés en dur par le package (voir
    // vendor/dedoc/scramble/src/Configuration/GeneratorConfigCollection.php),
    // quelle que soit cette valeur. `'docs/api'` ici ne correspondait à
    // aucune route réelle (toutes vivent sous `api/*`, préfixe posé par
    // `withRouting(api: ...)` dans bootstrap/app.php) : la doc se générait
    // sans erreur mais avec zéro route dedans.
    'api_path' => 'api',
    'info' => [
        // `title` n'est pas lu ici : Generator::makeOpenApi() lit le titre
        // depuis `ui.title` (défini plus bas), pas `info.title`. Resté sans
        // effet -- le titre retombait silencieusement sur config('app.name')
        // ("École") -- description et version sont bien lues d'ici.
        'description' => 'API RESTful complète pour la plateforme de gestion scolaire multi-tenant École.',
        'version' => '1.0.0',
    ],

    'ui' => [
        'title' => 'École API — Système de Gestion Scolaire',
    ],

    /*
    |--------------------------------------------------------------------------
    | Servers
    |--------------------------------------------------------------------------
    |
    | Format attendu par Generator::makeOpenApi() : un tableau associatif
    | description => URL (voir vendor/dedoc/scramble/config/scramble.php,
    | qui documente exactement cette forme), pas une liste de sous-tableaux
    | {url, description} comme dans le JSON OpenAPI brut. L'ancienne forme
    | cassait `docs/api.json` en 500 (et `scramble:export`) : le générateur
    | itère `foreach ($servers as $description => $url)` et passait le
    | sous-tableau entier à `url()` au lieu d'une chaîne.
    |
    */

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
