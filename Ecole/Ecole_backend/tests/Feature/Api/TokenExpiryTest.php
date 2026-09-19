<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Expiration des jetons de réinitialisation de mot de passe et de vérification
 * d'email (60 minutes).
 *
 * Carbon 3 rend `diffInMinutes()` signé : `now()->diffInMinutes($passé)` est
 * négatif. Les deux contrôleurs testaient `... > 60`, jamais vrai — un jeton
 * ne périmait donc jamais, quelle que soit son ancienneté. Aucun test ne
 * couvrait ces deux endpoints avant celui-ci.
 */
class TokenExpiryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $school = Ecole::factory()->create(['status' => 'active']);
        $this->user = User::factory()->create([
            'role' => 'parent',
            'ecole_id' => $school->id,
            'email' => 'parent@ecole.bj',
            'email_verified_at' => null,
            'password' => Hash::make('ancienmotdepasse'),
        ]);
    }

    private function resetToken(int $minutesAgo): void
    {
        DB::table('password_resets')->insert([
            'email' => $this->user->email,
            'token' => Hash::make('jeton-secret'),
            'created_at' => now()->subMinutes($minutesAgo),
        ]);
    }

    private function reset()
    {
        return $this->postJson('/api/auth/reset-password', [
            'email' => $this->user->email,
            'token' => 'jeton-secret',
            'password' => 'nouveaumotdepasse',
            'password_confirmation' => 'nouveaumotdepasse',
        ]);
    }

    private function verificationToken(int $minutesAgo): string
    {
        $plain = 'verif-' . $minutesAgo;

        DB::table('email_verification_tokens')->insert([
            'email' => $this->user->email,
            'token' => sha1($plain),
            'created_at' => now()->subMinutes($minutesAgo),
        ]);

        return $plain;
    }

    /* ─── Réinitialisation du mot de passe ───────────────────────────── */

    /** @test */
    public function a_recent_reset_token_changes_the_password()
    {
        $this->resetToken(30);

        $this->reset()->assertOk();

        $this->assertTrue(Hash::check('nouveaumotdepasse', $this->user->fresh()->password));
    }

    /** @test */
    public function a_reset_token_just_inside_the_hour_is_still_valid()
    {
        $this->resetToken(59);

        $this->reset()->assertOk();
    }

    /** @test */
    public function a_reset_token_older_than_an_hour_is_refused()
    {
        $this->resetToken(61);

        $this->reset()
            ->assertStatus(400)
            ->assertJsonPath('message', 'Le token de réinitialisation a expiré. Veuillez refaire une demande.');

        $this->assertTrue(Hash::check('ancienmotdepasse', $this->user->fresh()->password));
        $this->assertDatabaseMissing('password_resets', ['email' => $this->user->email]);
    }

    /** @test */
    public function a_reset_token_from_days_ago_is_refused()
    {
        $this->resetToken(60 * 24 * 3);

        $this->reset()->assertStatus(400);

        $this->assertTrue(Hash::check('ancienmotdepasse', $this->user->fresh()->password));
    }

    /* ─── Vérification de l'email ─────────────────────────────────────── */

    /** @test */
    public function a_recent_verification_link_verifies_the_email()
    {
        $token = $this->verificationToken(10);

        $this->getJson("/api/auth/verify-email/{$token}")->assertOk();

        $this->assertNotNull($this->user->fresh()->email_verified_at);
    }

    /** @test */
    public function a_verification_link_older_than_an_hour_is_refused()
    {
        $token = $this->verificationToken(61);

        $this->getJson("/api/auth/verify-email/{$token}")->assertStatus(422);

        $this->assertNull($this->user->fresh()->email_verified_at);
    }

    /** @test */
    public function a_verification_link_from_days_ago_is_refused()
    {
        $token = $this->verificationToken(60 * 24 * 3);

        $this->getJson("/api/auth/verify-email/{$token}")->assertStatus(422);

        $this->assertNull($this->user->fresh()->email_verified_at);
    }

    /** @test */
    public function an_unknown_verification_token_is_refused()
    {
        $this->getJson('/api/auth/verify-email/inconnu')->assertStatus(422);
    }
}
