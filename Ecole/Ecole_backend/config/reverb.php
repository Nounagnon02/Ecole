<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Reverb Server
    |--------------------------------------------------------------------------
    |
    | This option controls the default server used by Reverb to broadcast
    | events to your clients. You may configure multiple servers if you
    | need to support different broadcast endpoints.
    |
    */

    'default' => env('REVERB_SERVER', 'default'),

    /*
    |--------------------------------------------------------------------------
    | Servers
    |--------------------------------------------------------------------------
    |
    | Here you may define the server configurations for Reverb. Each server
    | can be configured with its own host, port, and SSL settings. The
    | `apps` array configures the app credentials for each server.
    |
    */

    'servers' => [

        'default' => [
            'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
            'port' => env('REVERB_SERVER_PORT', 8080),
            'hostname' => env('REVERB_HOST'),
            'options' => [
                'tls' => [],
            ],
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb_scaling'),
                'server' => [
                    'url' => env('REDIS_URL'),
                    'host' => env('REDIS_HOST', '127.0.0.1'),
                    'port' => env('REDIS_PORT', '6379'),
                    'username' => env('REDIS_USERNAME'),
                    'password' => env('REDIS_PASSWORD'),
                    'database' => env('REDIS_DB', '0'),
                ],
            ],
            'pulse_ingest' => env('REVERB_PULSE_INGEST', false),
            'telemetry' => env('REVERB_TELEMETRY', false),
            'allowed_origins' => explode(',', env('REVERB_ALLOWED_ORIGINS', 'localhost,127.0.0.1')),
            'ping_interval' => env('REVERB_PING_INTERVAL', 60),
            'max_nack_queue' => env('REVERB_MAX_NACK_QUEUE', 10_000),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Apps
    |--------------------------------------------------------------------------
    |
    | Here you may define the app credentials for each Reverb server. Each
    | app acts as a separate broadcasting namespace. The Pusher-compatible
    | credentials are shared with the frontend via environment variables.
    |
    */

    'apps' => [

        'provider' => 'config',

        'apps' => [
            [
                'app_id' => env('REVERB_APP_ID'),
                'key' => env('REVERB_APP_KEY'),
                'secret' => env('REVERB_APP_SECRET'),
                'capacity' => null,
                'enable_client_messages' => false,
                'enable_statistics' => true,
            ],
        ],

    ],

];
