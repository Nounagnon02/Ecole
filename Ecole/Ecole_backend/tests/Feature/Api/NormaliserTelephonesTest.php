<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Numéros enregistrés à 8 chiffres (audit du 14/11, BUG-012). Depuis le
 * 01/01/2025 seuls les numéros à 10 chiffres (préfixe 01) sont valides.
 * L'envoi et la connexion savaient convertir, mais les fiches gardaient
 * l'ancien numéro. La commande les convertit, après un essai à blanc.
 */
function numeros(): array
{
    $ecole = Ecole::factory()->create(['phone' => '21300000']);
    $u = fn (?string $tel) => User::factory()->create(['ecole_id' => $ecole->id, 'telephone' => $tel])->id;

    return [
        'ecole' => $ecole->id,
        'ancien_international' => $u('+22997123456'),
        'ancien_local' => $u('97 12 34 57'),
        'ancien_sans_plus' => $u('22997123458'),
        'deja_bon' => $u('+2290190000101'),
        'local_10' => $u('0190000102'),
        'illisible' => $u('abc'),
        'vide' => $u(null),
    ];
}

function tel(int $id): ?string
{
    return DB::table('users')->where('id', $id)->value('telephone');
}

it('n’écrit rien en essai à blanc et annonce ce qu’il ferait', function () {
    $ids = numeros();

    $this->artisan('ecole:normaliser-telephones', ['--dry-run' => true])
        ->expectsOutputToContain('Essai à blanc')
        ->assertSuccessful();

    expect(tel($ids['ancien_international']))->toBe('+22997123456')
        ->and(DB::table('ecoles')->where('id', $ids['ecole'])->value('phone'))->toBe('21300000');
});

it('convertit les numéros à 8 chiffres au format +229 01, sans toucher aux autres', function () {
    $ids = numeros();

    $this->artisan('ecole:normaliser-telephones')->assertSuccessful();

    expect(tel($ids['ancien_international']))->toBe('+2290197123456')
        ->and(tel($ids['ancien_local']))->toBe('+2290197123457')
        ->and(tel($ids['ancien_sans_plus']))->toBe('+2290197123458')
        ->and(tel($ids['deja_bon']))->toBe('+2290190000101')
        ->and(tel($ids['local_10']))->toBe('0190000102')
        ->and(tel($ids['illisible']))->toBe('abc')
        ->and(tel($ids['vide']))->toBeNull()
        ->and(DB::table('ecoles')->where('id', $ids['ecole'])->value('phone'))->toBe('+2290121300000');
});

it('peut être rejouée sans rien changer de plus', function () {
    $ids = numeros();
    $this->artisan('ecole:normaliser-telephones')->assertSuccessful();
    $apres = tel($ids['ancien_local']);

    $this->artisan('ecole:normaliser-telephones')->expectsOutputToContain('0 numéro')->assertSuccessful();

    expect(tel($ids['ancien_local']))->toBe($apres);
});
