<?php
return [
    'site_id'  => env('CINETPAY_SITE_ID'),
    'api_key'  => env('CINETPAY_API_KEY'),
    'mode'     => env('CINETPAY_MODE', 'TEST'),   // TEST | PROD
    'currency' => 'XOF',
    'notify_url' => env('CINETPAY_NOTIFY_URL', 'http://localhost:8000/api/cinetpay/notify'),
    'return_url' => env('CINETPAY_RETURN_URL', 'http://localhost:8000/api/cinetpay/return'),
];