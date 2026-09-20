<?php

namespace Tests\Feature\Security;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

/**
 * Cycle complet de la double authentification (TOTP) : activation, connexion en
 * deux temps, verrouillage du jeton « en attente », désactivation.
 *
 * Aucun test ne couvrait `TwoFactorController` ni `VerifyTwoFactor` avant
 * celui-ci. Le runbook de montée Laravel 12 exige de rejouer le flux complet
 * après la montée de `pragmarx/google2fa-laravel`, de `laravel/sanctum` et du
 * framework : les requêtes passent ici par de vrais jetons Bearer (Sanctum) et
 * de vrais codes TOTP calculés depuis le secret renvoyé par l'API.
 */
class TwoFactorFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Google2FA $totp;

    protected function setUp(): void
    {
        parent::setUp();

        $school = Ecole::factory()->create(['status' => 'active']);
        $this->user = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $school->id,
            'email' => 'directeur@ecole.bj',
            'password' => Hash::make('motdepasse123'),
        ]);
        $this->totp = new Google2FA();
    }

    /**
     * Requête avec un jeton Bearer donné (ou sans). Le garde Sanctum met en
     * cache l'utilisateur résolu : sans `forgetGuards()`, la deuxième requête
     * d'un même test réutiliserait l'identité de la première.
     */
    private function apiAs(string $method, string $uri, array $data = [], ?string $token = null)
    {
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();

        if ($token !== null) {
            $this->withHeaders(['Authorization' => "Bearer {$token}"]);
        }

        return $this->json($method, $uri, $data);
    }

    private function login(): \Illuminate\Testing\TestResponse
    {
        return $this->apiAs('POST', '/api/auth/login', [
            'email' => 'directeur@ecole.bj',
            'password' => 'motdepasse123',
        ]);
    }

    /** Un code à 6 chiffres qui n'est valide dans aucune des trois fenêtres tolérées. */
    private function invalidCode(string $secret): string
    {
        $ts = $this->totp->getTimestamp();
        $valid = [
            $this->totp->oathTotp($secret, $ts - 1),
            $this->totp->oathTotp($secret, $ts),
            $this->totp->oathTotp($secret, $ts + 1),
        ];

        foreach (['000000', '111111', '222222'] as $candidate) {
            if (!in_array($candidate, $valid, true)) {
                return $candidate;
            }
        }

        $this->fail('Aucun code invalide trouvé.');
    }

    /** Active la 2FA par les vrais endpoints ; renvoie [secret, jeton complet]. */
    private function enableTwoFactor(): array
    {
        $token = $this->login()->assertOk()->json('token');
        $secret = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->assertOk()->json('secret');

        $this->apiAs('POST', '/api/auth/2fa/verify', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertOk();

        return [$secret, $token];
    }

    /* ─── Activation ──────────────────────────────────────────────────── */

    /** @test */
    public function setup_returns_a_secret_and_a_qr_url_and_stores_the_secret_encrypted()
    {
        $token = $this->login()->assertOk()->json('token');

        $response = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->assertOk();

        $secret = $response->json('secret');
        $this->assertNotEmpty($secret);
        $this->assertStringStartsWith('otpauth://totp/', $response->json('qr_code_url'));
        $this->assertStringContainsString($secret, $response->json('qr_code_url'));

        $stored = $this->user->fresh()->two_factor_secret;
        $this->assertNotSame($secret, $stored, 'Le secret est stocké en clair.');
        $this->assertSame($secret, decrypt($stored));

        // Le secret existe mais la 2FA n'est pas active tant qu'un code n'a pas été prouvé.
        $this->assertFalse($this->user->fresh()->two_factor_enabled);
    }

    /** @test */
    public function a_wrong_code_does_not_enable_two_factor()
    {
        $token = $this->login()->assertOk()->json('token');
        $secret = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->json('secret');

        $this->apiAs('POST', '/api/auth/2fa/verify', [
            'code' => $this->invalidCode($secret),
        ], $token)->assertStatus(422);

        $this->assertFalse($this->user->fresh()->two_factor_enabled);
    }

    /** @test */
    public function a_correct_code_enables_two_factor()
    {
        $this->enableTwoFactor();

        $user = $this->user->fresh();
        $this->assertTrue($user->two_factor_enabled);
        $this->assertNotNull($user->two_factor_verified_at);
    }

    /** @test */
    public function setup_is_refused_once_two_factor_is_enabled()
    {
        [, $token] = $this->enableTwoFactor();

        $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->assertStatus(422);
    }

    /** @test */
    public function verifying_before_any_setup_is_refused()
    {
        $token = $this->login()->assertOk()->json('token');

        $this->apiAs('POST', '/api/auth/2fa/verify', ['code' => '123456'], $token)->assertStatus(422);
    }

    /* ─── Connexion en deux temps ─────────────────────────────────────── */

    /** @test */
    public function login_with_two_factor_enabled_only_returns_a_pending_token()
    {
        $this->enableTwoFactor();

        $response = $this->login()->assertOk();

        $this->assertTrue($response->json('requires_2fa'));
        $this->assertNotEmpty($response->json('token'));
        $this->assertNull($response->json('user'), 'Le profil ne doit pas être livré avant le second facteur.');

        $pending = PersonalAccessToken::findToken($response->json('token'));
        $this->assertSame(['2fa:pending'], $pending->abilities);
    }

    /** @test */
    public function a_pending_token_cannot_reach_anything_but_the_exchange_endpoint()
    {
        $this->enableTwoFactor();
        $pending = $this->login()->json('token');

        $this->apiAs('GET', '/api/auth/me', [], $pending)
            ->assertStatus(403)
            ->assertJsonPath('requires_2fa', true);

        $this->apiAs('GET', '/api/dashboard/directeur/data', [], $pending)->assertStatus(403);
    }

    /** @test */
    public function the_exchange_with_a_valid_code_returns_a_full_token_and_revokes_the_pending_one()
    {
        [$secret] = $this->enableTwoFactor();
        $pending = $this->login()->json('token');

        $response = $this->apiAs('POST', '/api/auth/2fa/verify-login', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $pending)->assertOk();

        $full = $response->json('token');
        $this->assertNotEmpty($full);
        $this->assertNotSame($pending, $full);
        $this->assertSame($this->user->id, $response->json('user.id'));

        // Le jeton complet ouvre l'API...
        $this->apiAs('GET', '/api/auth/me', [], $full)->assertOk();
        // ...et le jeton en attente est mort.
        $this->apiAs('GET', '/api/auth/me', [], $pending)->assertStatus(401);
    }

    /** @test */
    public function the_exchange_with_a_wrong_code_is_refused_and_issues_no_full_token()
    {
        [$secret] = $this->enableTwoFactor();
        $pending = $this->login()->json('token');

        $response = $this->apiAs('POST', '/api/auth/2fa/verify-login', [
            'code' => $this->invalidCode($secret),
        ], $pending)->assertStatus(422);

        $this->assertNull($response->json('token'));
        // Le jeton en attente reste cantonné : il ne donne toujours accès à rien.
        $this->apiAs('GET', '/api/auth/me', [], $pending)->assertStatus(403);
    }

    /** @test */
    public function the_exchange_endpoint_requires_a_token()
    {
        $this->apiAs('POST', '/api/auth/2fa/verify-login', ['code' => '123456'])->assertStatus(401);
    }

    /**
     * Tous les tests ci-dessus passent par un jeton Bearer (comme un client
     * mobile) — aucun ne reproduit un vrai navigateur SPA. `api-client.js`
     * (frontend) n'envoie jamais d'en-tête Authorization : il compte
     * uniquement sur le cookie de session, exactement comme
     * AuthController::connexion() l'établit pour la connexion primaire
     * (`Auth::login()` + `session()->regenerate()`). `verifyLogin()` ne le
     * faisait pas — le code TOTP était accepté, un jeton Bearer était bien
     * renvoyé, mais jamais utilisé par le SPA, et aucune session n'existait :
     * la requête suivante répondait 401 malgré une 2FA réussie.
     *
     * @test
     */
    public function completing_the_exchange_from_a_stateful_client_establishes_a_real_session()
    {
        [$secret] = $this->enableTwoFactor();

        // `Referer` dans sanctum.stateful : c'est ce que
        // EnsureFrontendRequestsAreStateful::fromFrontend() regarde pour
        // reconnaître un client SPA plutôt qu'un client à jeton.
        $this->withHeaders(['Referer' => 'http://localhost:3000/']);

        $pending = $this->postJson('/api/auth/login', [
            'email' => 'directeur@ecole.bj',
            'password' => 'motdepasse123',
        ])->assertOk()->json('token');

        // Authorization seulement pour cet appel précis (pas persisté sur
        // les suivants) : c'est ainsi que le pending token s'échange.
        $this->postJson('/api/auth/2fa/verify-login', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], ['Authorization' => "Bearer {$pending}"])->assertOk();

        $this->app['auth']->forgetGuards();

        // Le point du test : sans AUCUN jeton Bearer, seulement le cookie de
        // session déjà en place — comme le ferait vraiment api-client.js.
        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $this->user->id);
    }

    /* ─── Désactivation ───────────────────────────────────────────────── */

    /** @test */
    public function disabling_needs_a_valid_code_and_then_clears_the_secret()
    {
        [$secret, $token] = $this->enableTwoFactor();

        $this->apiAs('POST', '/api/auth/2fa/disable', [
            'code' => $this->invalidCode($secret),
        ], $token)->assertStatus(422);
        $this->assertTrue($this->user->fresh()->two_factor_enabled);

        $this->apiAs('POST', '/api/auth/2fa/disable', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertOk();

        $user = $this->user->fresh();
        $this->assertFalse($user->two_factor_enabled);
        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_verified_at);

        // La connexion suivante ne réclame plus de second facteur.
        $next = $this->login()->assertOk();
        $this->assertNull($next->json('requires_2fa'));
        $this->assertNotNull($next->json('user'));
    }

    /** @test */
    public function disabling_is_refused_when_two_factor_is_not_enabled()
    {
        $token = $this->login()->assertOk()->json('token');

        $this->apiAs('POST', '/api/auth/2fa/disable', ['code' => '123456'], $token)->assertStatus(422);
    }

    /** @test */
    public function a_code_must_be_exactly_six_characters()
    {
        $token = $this->login()->assertOk()->json('token');
        $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->assertOk();

        $this->apiAs('POST', '/api/auth/2fa/verify', ['code' => '12345'], $token)
            ->assertStatus(422)->assertJsonValidationErrors(['code']);
    }
}
