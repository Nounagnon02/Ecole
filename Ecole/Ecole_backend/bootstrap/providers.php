<?php

/*
| Remplace le tableau `providers` de config/app.php, retiré avec le passage au
| squelette Laravel 11. `RouteServiceProvider` a disparu : le routage est
| déclaré dans bootstrap/app.php et les limiteurs de débit dans
| AppServiceProvider.
*/

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\TenancyServiceProvider::class,
];
