<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Payment Provider
    |--------------------------------------------------------------------------
    |
    | Supported: 'stub', 'cinetpay', 'fedapay', 'stripe'
    |
    */
    'default_provider' => env('BILLING_PROVIDER', 'stub'),

    /*
    |--------------------------------------------------------------------------
    | CinetPay Configuration
    |--------------------------------------------------------------------------
    |
    */
    'cinetpay' => [
        'api_key' => env('CINETPAY_API_KEY', ''),
        'site_id' => env('CINETPAY_SITE_ID', ''),
        'sandbox' => env('CINETPAY_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | FedaPay Configuration
    |--------------------------------------------------------------------------
    |
    */
    'fedapay' => [
        'api_key' => env('FEDAPAY_API_KEY', ''),
        'secret_key' => env('FEDAPAY_SECRET_KEY', ''),
        'public_key' => env('FEDAPAY_PUBLIC_KEY', ''),
        'sandbox' => env('FEDAPAY_SANDBOX', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Stripe Configuration
    |--------------------------------------------------------------------------
    |
    */
    'stripe' => [
        'secret_key' => env('STRIPE_SECRET_KEY', ''),
        'public_key' => env('STRIPE_PUBLIC_KEY', ''),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    */
    'currency' => env('BILLING_CURRENCY', 'XOF'),
    'locale' => env('BILLING_LOCALE', 'fr'),

    /*
    |--------------------------------------------------------------------------
    | Trial Settings
    |--------------------------------------------------------------------------
    |
    */
    'trial_days' => env('BILLING_TRIAL_DAYS', 14),

];
