<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Destinataire des alertes
    |--------------------------------------------------------------------------
    |
    | Adresse recevant les anomalies (job en échec, webhook rejeté). Laissée
    | vide tant que l'astreinte n'est pas décidée : les anomalies sont alors
    | seulement journalisées (Log::critical/warning, remontées à Sentry si
    | configuré), jamais silencieusement perdues.
    |
    */

    'mail_to' => env('ALERT_EMAIL'),

];
