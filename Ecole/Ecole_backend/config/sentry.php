<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sentry DSN
    |--------------------------------------------------------------------------
    |
    | The DSN is used to send events to Sentry. You can find it in your
    | Sentry project settings under "Client Keys (DSN)".
    |
    */

    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    /*
    |--------------------------------------------------------------------------
    | Environment
    |--------------------------------------------------------------------------
    |
    */

    'environment' => env('APP_ENV'),

    /*
    |--------------------------------------------------------------------------
    | Release
    |--------------------------------------------------------------------------
    |
    | Set to the git commit hash to track which version caused the error.
    |
    */

    'release' => trim(exec('git log --pretty="%h" -n1 HEAD')),

    /*
    |--------------------------------------------------------------------------
    | Breadcrumb levels
    |--------------------------------------------------------------------------
    |
    */

    'breadcrumbs' => [
        'sql_queries' => env('SENTRY_BREADCRUMBS_SQL', true),
        'sql_bindings' => env('SENTRY_BREADCRUMBS_SQL_BINDINGS', true),
        'queue_info' => env('SENTRY_BREADCRUMBS_QUEUE', true),
        'command_info' => env('SENTRY_BREADCRUMBS_COMMAND', true),
        'http_client_requests' => env('SENTRY_BREADCRUMBS_HTTP_CLIENT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance tracing
    |--------------------------------------------------------------------------
    |
    */

    'tracing' => [
        'enabled' => env('SENTRY_TRACING_ENABLED', true),
        'routes' => env('SENTRY_TRACING_ROUTES', true),
        'views' => env('SENTRY_TRACING_VIEWS', true),
        'sql_queries' => env('SENTRY_TRACING_SQL', true),
        'sql_bindings' => env('SENTRY_TRACING_SQL_BINDINGS', true),
        'queue_jobs' => env('SENTRY_TRACING_QUEUE', true),
        'redis' => env('SENTRY_TRACING_REDIS', true),
        'http_client_requests' => env('SENTRY_TRACING_HTTP_CLIENT', true),
        'slow_requests' => [
            'enabled' => env('SENTRY_TRACING_SLOW_REQUESTS', true),
            'threshold_ms' => env('SENTRY_TRACING_SLOW_REQUESTS_THRESHOLD', 1000),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Send default PII
    |--------------------------------------------------------------------------
    |
    | Sends user info (ID, email, IP) with events.
    |
    */

    'send_default_pii' => env('SENTRY_SEND_DEFAULT_PII', false),

];
