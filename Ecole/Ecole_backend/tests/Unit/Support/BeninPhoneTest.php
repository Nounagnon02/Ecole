<?php

use App\Services\SmsService;
use App\Support\BeninPhone;
use Illuminate\Support\Facades\Http;

/*
 * Le Bénin est passé à une numérotation à 10 chiffres (préfixe 01) fin
 * novembre 2024. SmsService n'acceptait que 8 chiffres : tout numéro saisi au
 * format en vigueur était rejeté, et aucun SMS ne partait (audit BUG-012).
 */

it('normalise un numéro béninois vers le format international', function (string $saisi, string $attendu) {
    expect(BeninPhone::normalize($saisi))->toBe($attendu);
})->with([
    'local, 10 chiffres' => ['0197123456', '+2290197123456'],
    'international, 10 chiffres' => ['+2290197123456', '+2290197123456'],
    'indicatif sans +' => ['2290197123456', '+2290197123456'],
    'indicatif en 00' => ['002290197123456', '+2290197123456'],
    'espaces et tirets' => ['+229 01 97-12 34 56', '+2290197123456'],
    'ancien format local, 8 chiffres' => ['97123456', '+2290197123456'],
    'ancien format international' => ['+22997123456', '+2290197123456'],
    'ancien format, indicatif sans +' => ['22997123456', '+2290197123456'],
]);

it('refuse ce qui n’est pas un numéro béninois', function (string $saisi) {
    expect(BeninPhone::normalize($saisi))->toBeNull();
})->with([
    'vide' => [''],
    'trop court' => ['971234'],
    '9 chiffres' => ['019712345'],
    '10 chiffres sans le préfixe 01' => ['9712345678'],
    'lettres' => ['01971234ab'],
    'autre pays' => ['+33612345678'],
    'trop long' => ['+229019712345678'],
]);

it('reconnaît un numéro valide', function () {
    expect(BeninPhone::isValid('0197123456'))->toBeTrue()
        ->and(BeninPhone::isValid('12345'))->toBeFalse();
});

it('envoie le SMS au numéro normalisé, y compris à 10 chiffres', function () {
    config(['services.africastalking.api_key' => 'cle-de-test', 'services.africastalking.username' => 'sandbox']);
    Http::fake(['*' => Http::response(['SMSMessageData' => ['Recipients' => [['status' => 'Success', 'messageId' => 'ATX1']]]])]);

    $resultat = (new SmsService)->send('0197123456', 'Bonjour');

    expect($resultat['success'])->toBeTrue();
    Http::assertSent(fn ($requete) => $requete['to'] === '+2290197123456');
});

it('n’appelle pas le fournisseur pour un numéro invalide', function () {
    config(['services.africastalking.api_key' => 'cle-de-test', 'services.africastalking.username' => 'sandbox']);
    Http::fake();

    $resultat = (new SmsService)->send('12345', 'Bonjour');

    expect($resultat['success'])->toBeFalse();
    Http::assertNothingSent();
});

it('fait échouer la validation d’un formulaire sur un numéro mal formé', function () {
    $regles = ['telephone' => [new App\Rules\BeninPhoneNumber]];

    expect(validator(['telephone' => '0197123456'], $regles)->passes())->toBeTrue()
        ->and(validator(['telephone' => '97123456'], $regles)->passes())->toBeTrue()
        ->and(validator(['telephone' => '12345'], $regles)->fails())->toBeTrue()
        ->and(validator(['telephone' => '12345'], $regles)->errors()->first('telephone'))->toContain('10 chiffres');
});
