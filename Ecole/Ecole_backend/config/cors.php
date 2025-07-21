<?php
// Ecole/Ecole_backend/config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', 'cinetpay/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000','https://ecole-one.vercel.app/'], // Remplacez par votre URL frontend
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];

