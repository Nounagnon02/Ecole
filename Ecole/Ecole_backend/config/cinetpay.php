<?php
return [
    'site_id'   => env('CINETPAY_SITE_ID'),
    'api_key'   => env('CINETPAY_API_KEY'),
    'notify'    => env('CINETPAY_NOTIFY_URL'),   // https://your-domain.com/api/cinetpay/notify
    'return'    => env('CINETPAY_RETURN_URL'),    // https://your-domain.com/api/cinetpay/return
    'mode'      => env('CINETPAY_MODE', 'TEST'),  // TEST | PROD
    'currency'  => 'XOF',
];