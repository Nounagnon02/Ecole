<?php
// Ecole/Ecole_backend/config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'cinetpay/*', '*'],
    'allowed_methods' => ['*'   ],
    
    //'allowed_methods' => ['*'], 
    
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:8000',
        'https://ecoleprojet.up.railway.app',
        'https://ecole-projet.vercel.app'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['*'],
    'max_age' => 0,
    'supports_credentials' => true,
];

