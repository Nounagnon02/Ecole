<?php

namespace Tests\Feature\Security;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

/**
 * 2FA obligatoire pour comptable, directeur, admin, super-admin
 * (`Roles::requiresTwoFactor()`) — la 2FA elle-même (activation, challenge de
 * connexion, désactivation) est testée en général dans `TwoFactorFlowTest`,
 * avec un rôle qui n'y est PAS soumis. Ici : ce que ces quatre rôles ne
 * peuvent plus faire tant qu'ils ne l'ont pas activée, et qu'ils ne peuvent
 * plus s'en dispenser une fois activée.
 */
class MandatoryTwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Google2FA $totp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->totp = new Google2FA();
    }

    /**
     * `two_factor_enabled => false` explicite : `UserFactory::configure()`
     * active automatiquement la 2FA par défaut pour ces rôles (pour ne pas
     * casser les ~200 tests qui créent un tel compte pour tester autre
     * chose) — ce fichier teste justement le parcours AVANT activation, il
     * doit donc écraser ce réglage automatique.
     */
    private function makeUser(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'ecole_id' => $this->school->id,
            'email' => "{$role}@ecole.bj",
            'password' => Hash::make('motdepasse123'),
            'two_factor_enabled' => false,
        ]);
    }

    private function apiAs(string $method, string $uri, array $data = [], ?string $token = null)
    {
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();

        if ($token !== null) {
            $this->withHeaders(['Authorization' => "Bearer {$token}"]);
        }

        return $this->json($method, $uri, $data);
    }

    private function login(string $email): \Illuminate\Testing\TestResponse
    {
        return $this->apiAs('POST', '/api/auth/login', [
            'email' => $email,
            'password' => 'motdepasse123',
        ]);
    }

    /** @test */
    public function comptable_directeur_admin_and_super_admin_are_prompted_to_set_up_on_login()
    {
        foreach (['comptable', 'directeur', 'admin', 'super-admin'] as $role) {
            $user = $this->makeUser($role);

            $response = $this->login($user->email)->assertOk();

            $this->assertTrue($response->json('requires_2fa_setup'), "rôle {$role}");
            $this->assertSame($role, $response->json('user.role'), "rôle {$role}");
            $this->assertNotEmpty($response->json('token'), "rôle {$role}");
            $this->assertNull($response->json('requires_2fa'), "rôle {$role} ne doit pas déclencher le challenge de code : il n'y a pas encore de secret");
        }
    }

    /** @test */
    public function a_mandatory_role_without_two_factor_can_only_reach_setup_related_routes()
    {
        $user = $this->makeUser('comptable');
        $token = $this->login($user->email)->json('token');

        $this->apiAs('GET', '/api/auth/me', [], $token)->assertOk();

        $blocked = $this->apiAs('GET', '/api/dashboard/directeur/data', [], $token)
            ->assertStatus(403);
        $this->assertTrue($blocked->json('requires_2fa_setup'));

        // Le setup et la vérification eux-mêmes doivent rester atteignables :
        // c'est tout le sens de l'allowlist, sinon personne ne pourrait
        // jamais sortir de cet état.
        $secret = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->assertOk()->json('secret');
        $this->apiAs('POST', '/api/auth/2fa/verify', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertOk();
    }

    /** @test */
    public function completing_setup_unblocks_normal_api_access()
    {
        $user = $this->makeUser('directeur');
        $token = $this->login($user->email)->json('token');
        $secret = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->json('secret');
        $this->apiAs('POST', '/api/auth/2fa/verify', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertOk();

        // Un directeur fraîchement activé n'a plus de jeton complet en main
        // (verify() n'en émet pas — voir TwoFactorController::verify()) : il
        // doit se reconnecter, et cette fois affronter le VRAI challenge de
        // code, pas un nouveau prompt de configuration.
        $response = $this->login($user->email)->assertOk();
        $this->assertTrue($response->json('requires_2fa'));
        $this->assertNull($response->json('requires_2fa_setup'));

        $pending = $response->json('token');
        $full = $this->apiAs('POST', '/api/auth/2fa/verify-login', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $pending)->json('token');

        $this->apiAs('GET', '/api/auth/me', [], $full)->assertOk();
    }

    /** @test */
    public function a_mandatory_role_cannot_disable_two_factor()
    {
        $user = $this->makeUser('super-admin');
        $token = $this->login($user->email)->json('token');
        $secret = $this->apiAs('POST', '/api/auth/2fa/setup', [], $token)->json('secret');
        $this->apiAs('POST', '/api/auth/2fa/verify', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertOk();

        $this->apiAs('POST', '/api/auth/2fa/disable', [
            'code' => $this->totp->getCurrentOtp($secret),
        ], $token)->assertStatus(422);

        $this->assertTrue($user->fresh()->two_factor_enabled);
    }

    /** @test */
    public function the_setup_prompt_establishes_a_real_session_for_a_stateful_client()
    {
        $user = $this->makeUser('admin');

        $this->withHeaders(['Referer' => 'http://localhost:3000/']);
        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'motdepasse123',
        ])->assertOk()->assertJsonPath('requires_2fa_setup', true);

        $this->app['auth']->forgetGuards();

        // Sans jeton Bearer : uniquement la session déjà posée par la
        // réponse ci-dessus doit suffire à atteindre /auth/2fa/setup.
        $this->postJson('/api/auth/2fa/setup')->assertOk();
    }

    /** @test */
    public function roles_without_the_requirement_log_in_normally_without_any_prompt()
    {
        foreach (['enseignant', 'secretaire', 'eleve', 'parent', 'surveillant'] as $role) {
            $user = $this->makeUser($role);

            $response = $this->login($user->email)->assertOk();

            $this->assertNull($response->json('requires_2fa_setup'), "rôle {$role}");
            $this->assertNull($response->json('requires_2fa'), "rôle {$role}");
            $this->assertSame($role, $response->json('user.role'), "rôle {$role}");
        }
    }
}
