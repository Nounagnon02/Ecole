<?php

namespace Tests\Unit\Traits;

use App\Models\AuditLog;
use App\Models\Ecole;
use App\Models\User;
use App\Support\SchoolContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `getOriginal()`/`getChanges()` (utilisés par `Auditable::logAudit()`)
 * ignorent `$hidden` -- qui ne s'applique qu'à `toArray()`/`toJson()`. Sans
 * une liste explicite de colonnes à exclure, un changement de mot de passe
 * ou de secret 2FA écrirait sa valeur dans `audit_logs`, une table pensée
 * pour être consultée plus largement que `users` lui-même (cf. l'UI d'audit
 * consultable qui vient d'être ajoutée).
 */
class AuditableTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function updating_the_two_factor_secret_never_writes_it_to_the_audit_log()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['ecole_id' => $school->id]);

        $user->two_factor_secret = encrypt('JBSWY3DPEHPK3PXP');
        $user->save();

        $log = SchoolContext::for($school->id, fn () => AuditLog::where('auditable_type', User::class)
            ->where('auditable_id', $user->id)
            ->where('event', 'updated')
            ->latest()
            ->first());

        $this->assertNotNull($log, 'La mise à jour doit tout de même être journalisée.');
        $this->assertArrayNotHasKey('two_factor_secret', $log->new_values ?? []);
        $this->assertArrayNotHasKey('two_factor_secret', $log->old_values ?? []);
    }

    /**
     * `AuditLog::$casts` encode déjà ce champ en JSON à l'écriture --
     * `logAudit()` l'encodait une deuxième fois, si bien que relu, la
     * colonne renvoyait une chaîne JSON encore encodée plutôt qu'un tableau
     * PHP exploitable. Jamais vu avant l'ajout de l'UI d'audit, faute d'un
     * seul lecteur de ces deux colonnes ailleurs dans le dépôt.
     *
     * @test
     */
    public function old_and_new_values_decode_to_real_arrays_not_a_still_encoded_string()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['ecole_id' => $school->id, 'name' => 'Avant']);

        $user->name = 'Après';
        $user->save();

        $log = SchoolContext::for($school->id, fn () => AuditLog::where('auditable_type', User::class)
            ->where('auditable_id', $user->id)
            ->where('event', 'updated')
            ->latest()
            ->first());

        $this->assertIsArray($log->new_values);
        $this->assertSame('Après', $log->new_values['name']);
        $this->assertIsArray($log->old_values);
        $this->assertSame('Avant', $log->old_values['name']);
    }

    /** @test */
    public function updating_the_password_never_writes_it_to_the_audit_log()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $user = User::factory()->create(['ecole_id' => $school->id]);

        $user->password = 'un-nouveau-mot-de-passe';
        $user->save();

        $log = SchoolContext::for($school->id, fn () => AuditLog::where('auditable_type', User::class)
            ->where('auditable_id', $user->id)
            ->where('event', 'updated')
            ->latest()
            ->first());

        $this->assertNotNull($log);
        $this->assertArrayNotHasKey('password', $log->new_values ?? []);
    }
}
