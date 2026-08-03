<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Sans ce fichier, les tests écrits en syntaxe Pest (`test('...', fn() => ...)`)
| s'exécutent sur le TestCase nu de Pest : ils n'ont ni application Laravel ni
| helpers HTTP, et échouent tous sur « Call to undefined method postJson() ».
| Les fichiers concernés étaient AuthAndHealthTest, SaaS/BillingTest,
| SaaS/OnboardingAndAdminTest et Unit/Models/SaasModelTest.
|
*/

uses(Tests\TestCase::class)->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Base de données
|--------------------------------------------------------------------------
|
| Les tests écrits en syntaxe Pest ne déclaraient pas RefreshDatabase : aucune
| migration ne tournait et toute requête échouait sur « no such table ». Les
| tests en classe utilisent déjà le trait ; on l'applique ici pour les autres,
| afin que les deux styles partent d'un schéma identique.
|
*/

uses(Illuminate\Foundation\Testing\RefreshDatabase::class)->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
