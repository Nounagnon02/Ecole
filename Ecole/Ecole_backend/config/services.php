<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'kkiapay' => [
    'public_key' => env('4bdb53c05f9b11f0a92639a78a9aeb42'),
    'private_key' => env('tpk_4bdba1e05f9b11f0a92639a78a9aeb42'),
    'secret_key' => env('tsk_4bdba1e15f9b11f0a92639a78a9aeb42'),
    'sandbox' => env('KKIAPAY_SANDBOX', true),

    ],

    'cinetpay' => [
        'api_key' => env('CINETPAY_API_KEY'),
        'site_id' => env('CINETPAY_SITE_ID'),
        'secret_key' => env('CINETPAY_SECRET_KEY'),
        'environment' => env('CINETPAY_ENVIRONMENT', 'sandbox'),
        'currency' => env('CINETPAY_CURRENCY', 'XOF'),
    ],
];

