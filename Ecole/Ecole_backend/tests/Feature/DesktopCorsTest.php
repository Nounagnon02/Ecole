<?php

/*
 * L'application desktop (Electron) charge l'interface depuis `ecole://app`
 * et appelle l'API par HTTP : sans cette origine dans la liste CORS, le
 * navigateur intégré refusait toute réponse, connexion comprise (constaté
 * sur l'application lancée le 15/11/2026).
 */

it('autorise l’origine de l’application desktop', function () {
    $this->withHeaders([
        'Origin' => 'ecole://app',
        'Access-Control-Request-Method' => 'POST',
        'Access-Control-Request-Headers' => 'content-type',
    ])->options('/api/auth/login')
        ->assertHeader('Access-Control-Allow-Origin', 'ecole://app');
});

it('n’autorise pas une origine inconnue', function () {
    $reponse = $this->withHeaders([
        'Origin' => 'https://site-tiers.example',
        'Access-Control-Request-Method' => 'POST',
    ])->options('/api/auth/login');

    expect($reponse->headers->get('Access-Control-Allow-Origin'))->not->toBe('https://site-tiers.example');
});
