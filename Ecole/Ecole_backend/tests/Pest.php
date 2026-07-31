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
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});
