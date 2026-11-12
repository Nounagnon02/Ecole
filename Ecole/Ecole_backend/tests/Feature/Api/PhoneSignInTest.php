<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

/*
 * Connexion et mot de passe oublié par numéro de téléphone (lot 7.3).
 */

beforeEach(function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $this->parent = User::factory()->create(['role' => 'parent', 'ecole_id' => $ecole->id, 'identifiant' => 'PAR777',
        'telephone' => '+22997123456', 'password' => Hash::make('Secret2026'), 'is_active' => true]);
});

it('connecte avec le numéro sous ses différentes écritures, y compris l’ancien format enregistré', function (string $saisi) {
    $this->postJson('/api/auth/login', ['email' => $saisi, 'identifiant' => $saisi, 'password' => 'Secret2026'])->assertOk();
})->with(['0197123456', '01 97 12 34 56', '+229 01 97 12 34 56', '97123456']);

it('refuse un mauvais mot de passe même avec le bon numéro', function () {
    $this->postJson('/api/auth/login', ['email' => '0197123456', 'identifiant' => '0197123456', 'password' => 'faux'])->assertStatus(401);
});

it('réinitialise le mot de passe par code SMS, sans envoyer de vrai SMS par défaut', function () {
    Http::fake();
    $code = null;
    Log::listen(function ($message) use (&$code) {
        if (str_starts_with($message->message, 'SMS (journal') && preg_match('/(\d{6})/', $message->context['message'] ?? '', $m)) {
            $code = $m[1];
        }
    });

    $this->postJson('/api/auth/mot-de-passe-oublie/sms', ['telephone' => '0197123456'])->assertOk();
    Http::assertNothingSent();
    expect($code)->not->toBeNull();

    $this->postJson('/api/auth/mot-de-passe-oublie/sms/confirmer', ['telephone' => '0197123456', 'code' => $code === '000000' ? '111111' : '000000', 'password' => 'Nouveau2026', 'password_confirmation' => 'Nouveau2026'])
        ->assertStatus(422);
    $this->postJson('/api/auth/mot-de-passe-oublie/sms/confirmer', ['telephone' => '+2290197123456', 'code' => $code, 'password' => 'Nouveau2026', 'password_confirmation' => 'Nouveau2026'])
        ->assertOk();

    expect(Hash::check('Nouveau2026', $this->parent->fresh()->password))->toBeTrue();
    // Le code ne sert qu'une fois.
    $this->postJson('/api/auth/mot-de-passe-oublie/sms/confirmer', ['telephone' => '0197123456', 'code' => $code, 'password' => 'Autre20266', 'password_confirmation' => 'Autre20266'])
        ->assertStatus(422);
});

it('répond pareil pour un numéro inconnu, sans rien envoyer', function () {
    Log::spy();

    $this->postJson('/api/auth/mot-de-passe-oublie/sms', ['telephone' => '0196000000'])
        ->assertOk()->assertJsonPath('message', fn ($m) => str_contains($m, 'Si ce numéro'));

    Log::shouldNotHaveReceived('info', [Mockery::pattern('/^SMS/'), Mockery::any()]);
});

it('bloque après cinq codes faux', function () {
    $this->postJson('/api/auth/mot-de-passe-oublie/sms', ['telephone' => '0197123456'])->assertOk();
    foreach (range(1, 5) as $i) {
        $this->postJson('/api/auth/mot-de-passe-oublie/sms/confirmer', ['telephone' => '0197123456', 'code' => '99999'.$i, 'password' => 'Nouveau2026', 'password_confirmation' => 'Nouveau2026']);
    }

    $this->postJson('/api/auth/mot-de-passe-oublie/sms/confirmer', ['telephone' => '0197123456', 'code' => '123456', 'password' => 'Nouveau2026', 'password_confirmation' => 'Nouveau2026'])
        ->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'expiré'));
});
