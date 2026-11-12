<?php

use App\Models\Ecole;
use App\Models\User;
use App\Support\CodesSecours;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FA\Google2FA;

uses(RefreshDatabase::class);

/*
 * Double authentification (lot 7.4) : codes de secours et déblocage.
 */

function directeurAvec2fa(): User
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);
    $user->forceFill(['two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP'), 'two_factor_enabled' => false])->save();

    return $user;
}

it('remet huit codes de secours à l’activation, stockés hachés hors de users', function () {
    $user = directeurAvec2fa();

    $codes = $this->actingAs($user)->postJson('/api/auth/2fa/verify', ['code' => (new Google2FA)->getCurrentOtp('JBSWY3DPEHPK3PXP')])
        ->assertOk()->json('codes_secours');

    expect($codes)->toHaveCount(8)
        ->and($codes[0])->toMatch('/^[A-Z2-9]{4}-[A-Z2-9]{4}$/')
        ->and(DB::table('codes_secours_2fa')->where('user_id', $user->id)->count())->toBe(8)
        ->and(DB::table('codes_secours_2fa')->where('hachage', $codes[0])->exists())->toBeFalse()
        ->and(array_key_exists('two_factor_recovery_codes', $user->fresh()->toArray()))->toBeFalse();
});

it('ouvre la session avec un code de secours, une seule fois', function () {
    $user = directeurAvec2fa();
    $user->forceFill(['two_factor_enabled' => true])->save();
    $codes = CodesSecours::regenerer($user);
    $jeton = $user->createToken('2fa-pending', ['2fa:pending'])->plainTextToken;

    $this->withToken($jeton)->postJson('/api/auth/2fa/verify-login', ['code' => strtolower($codes[3])])->assertOk();
    expect(CodesSecours::restants($user))->toBe(7);

    $jeton2 = $user->createToken('2fa-pending', ['2fa:pending'])->plainTextToken;
    app('auth')->forgetGuards();
    $this->withToken($jeton2)->postJson('/api/auth/2fa/verify-login', ['code' => $codes[3]])->assertStatus(422);
});

it('régénère les codes et rend les anciens caducs', function () {
    $user = directeurAvec2fa();
    $user->forceFill(['two_factor_enabled' => true])->save();
    $anciens = CodesSecours::regenerer($user);

    $nouveaux = $this->actingAs($user)->withSession(['two_factor_verified' => true])->postJson('/api/auth/2fa/codes-secours')->assertOk()->json('codes_secours');

    expect(CodesSecours::consommer($user, $anciens[0]))->toBeFalse()
        ->and(CodesSecours::consommer($user, $nouveaux[0]))->toBeTrue();
});

it('laisse le super-administrateur débloquer un compte, et lui seul', function () {
    $user = directeurAvec2fa();
    $user->forceFill(['two_factor_enabled' => true])->save();
    CodesSecours::regenerer($user);
    $admin = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]);
    $admin->forceFill(['two_factor_enabled' => true, 'two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP')])->save();

    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $user->ecole_id]))
        ->postJson("/api/admin/utilisateurs/{$user->id}/reinitialiser-2fa")->assertStatus(403);

    $this->actingAs($admin)->withSession(['two_factor_verified' => true])
        ->postJson("/api/admin/utilisateurs/{$user->id}/reinitialiser-2fa")->assertOk();

    expect($user->fresh()->two_factor_enabled)->toBeFalse()->and(CodesSecours::restants($user))->toBe(0);
});
