<?php

/*
 * L'application sert des écoles béninoises : messages en français, heure du
 * Bénin. Elle tournait en anglais et en UTC (audit BUG-017, BUG-024).
 */

it('rédige les messages de validation en français', function () {
    $erreurs = validator([], ['titre' => 'required', 'date_naissance' => 'required'])->errors();

    expect($erreurs->first('titre'))->toBe('Le champ titre est obligatoire.')
        ->and($erreurs->first('date_naissance'))->toBe('Le champ date de naissance est obligatoire.');
});

it('traduit chaque règle que la version anglaise connaît', function () {
    $anglais = require base_path('lang/en/validation.php');
    $francais = require base_path('lang/fr/validation.php');

    expect(array_diff(array_keys($anglais), array_keys($francais)))->toBe([]);
});

it('horodate à l’heure du Bénin', function () {
    expect(config('app.timezone'))->toBe('Africa/Porto-Novo')
        ->and(now()->utcOffset())->toBe(60);
});
