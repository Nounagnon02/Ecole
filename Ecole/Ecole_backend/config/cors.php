<?php
// Ecole/Ecole_backend/config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'cinetpay/*'],
    'allowed_methods' => [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],
    'allowed_origins' => [
        'http://localhost:3000',
        /*'https://ecole-production-2c90.up.railway.app',*/ // HTTPS seulement
        'https://ecole-one.vercel.app'
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];

