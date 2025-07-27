<?php
// Ecole/Ecole_backend/config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'cinetpay/*', '*'],
    /*'allowed_methods' => [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],*/
    'allowed_methods' => ['*'], 
    
    'allowed_origins' => [
        'http://localhost:3000',
        'https://ecoleprojet.up.railway.app',
        'https://ecole-projet.vercel.app'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];

