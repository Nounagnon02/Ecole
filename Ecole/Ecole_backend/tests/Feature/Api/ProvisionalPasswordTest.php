<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/*
 * Un mot de passe provisoire est connu de l'agent qui l'a remis. Tant que son
 * titulaire ne l'a pas remplacé, le compte ne peut rien faire d'autre.
 */

function compteProvisoire(string $role = 'parent'): User
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $user = User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id, 'password' => Hash::make('Provisoire1')]);
    $user->forceFill(['password_change_required' => true])->save();

    return $user;
}

it('marque provisoires les mots de passe produits à l’inscription, pas celui que l’agent choisit', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $this->actingAs(User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]));

    $this->postJson('/api/eleves/store', [
        'name' => 'DOSSOU', 'prenom' => 'Afi', 'classe_id' => $classe->id,
        'parent' => ['name' => 'DOSSOU', 'telephone' => '0197000001'],
    ])->assertCreated();
    $this->postJson('/api/eleves/store', [
        'name' => 'DOSSOU', 'prenom' => 'Sena', 'classe_id' => $classe->id, 'password' => 'ChoisiParAgent1',
    ])->assertCreated();

    expect((bool) User::where('role', 'parent')->sole()->password_change_required)->toBeTrue()
        ->and(User::where('role', 'eleve')->orderBy('id')->pluck('password_change_required')->map(fn ($v) => (bool) $v)->all())
        ->toBe([true, false]);
});

it('le signale à la connexion et dans le profil', function () {
    $user = compteProvisoire();

    $this->postJson('/api/auth/login', ['identifiant' => $user->identifiant ?? $user->email, 'email' => $user->email, 'password' => 'Provisoire1'])
        ->assertOk()->assertJsonPath('requires_password_change', true);

    $this->actingAs($user)->getJson('/api/auth/me')->assertOk();
    expect(app(ProfileService::class)->payload($user)['password_change_required'])->toBeTrue();
});

it('ferme le reste de l’API tant que le mot de passe n’est pas remplacé', function () {
    $this->actingAs(compteProvisoire());

    $this->getJson('/api/parent/enfants')->assertStatus(403)->assertJsonPath('requires_password_change', true);
    $this->getJson('/api/messages/received')->assertStatus(403);
});

it('rouvre l’accès une fois le mot de passe remplacé', function () {
    $user = compteProvisoire();
    $this->actingAs($user);

    $this->postJson('/api/auth/change-password', [
        'current_password' => 'Provisoire1', 'password' => 'MonSecret2026', 'password_confirmation' => 'MonSecret2026',
    ])->assertOk();

    $user->refresh();
    expect((bool) $user->password_change_required)->toBeFalse()
        ->and(Hash::check('MonSecret2026', $user->password))->toBeTrue();
    $this->getJson('/api/parent/enfants')->assertOk();
});

it('refuse un changement mal formé et garde la restriction', function (array $saisie, string $champ) {
    $user = compteProvisoire();

    $this->actingAs($user)->postJson('/api/auth/change-password', $saisie + [
        'current_password' => 'Provisoire1', 'password' => 'MonSecret2026', 'password_confirmation' => 'MonSecret2026',
    ])->assertStatus(422)->assertJsonValidationErrors($champ);

    expect((bool) $user->fresh()->password_change_required)->toBeTrue();
})->with([
    'ancien mot de passe faux' => [['current_password' => 'Faux'], 'current_password'],
    'trop court' => [['password' => 'court', 'password_confirmation' => 'court'], 'password'],
    'confirmation différente' => [['password_confirmation' => 'Autre2026xx'], 'password'],
    'identique au provisoire' => [['password' => 'Provisoire1', 'password_confirmation' => 'Provisoire1'], 'password'],
]);

it('laisse un rôle à 2FA obligatoire remplacer son mot de passe avant d’activer la 2FA', function () {
    $this->actingAs(compteProvisoire('comptable'));

    $this->postJson('/api/auth/change-password', [
        'current_password' => 'Provisoire1', 'password' => 'MonSecret2026', 'password_confirmation' => 'MonSecret2026',
    ])->assertOk();
});

it('ne gêne pas un compte ordinaire', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]));

    $this->getJson('/api/eleves')->assertOk();
});
