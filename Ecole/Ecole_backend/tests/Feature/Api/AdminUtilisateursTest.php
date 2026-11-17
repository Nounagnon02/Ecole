<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Comptes gérés par l'administrateur d'école (BUG-023, audit du 14/11).
 *
 * `User` échappe au filtre par école (BelongsToEcole l'exclut) et
 * `AdminController` ne bornait rien : un administrateur d'école listait,
 * désactivait ou supprimait les comptes de toutes les écoles, y compris le
 * super-administrateur. Et désactiver un compte ne fermait pas ses sessions.
 */
function deuxEcolesAdmin(): array
{
    $a = Ecole::factory()->create(['status' => 'active']);
    $b = Ecole::factory()->create(['status' => 'active']);
    $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $a->id]);
    $collegue = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $a->id, 'is_active' => true]);
    $etranger = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $b->id, 'is_active' => true]);
    $super = User::factory()->create(['role' => 'super-admin', 'ecole_id' => null, 'is_active' => true]);
    test()->actingAs($admin);

    return compact('a', 'b', 'admin', 'collegue', 'etranger', 'super');
}

it('ne liste que les comptes de l’école de l’administrateur', function () {
    ['collegue' => $collegue, 'etranger' => $etranger, 'super' => $super, 'b' => $b] = deuxEcolesAdmin();

    $ids = collect($this->getJson('/api/admin/utilisateurs?per_page=100')->assertOk()->json('data'))->pluck('id');
    $avecFiltre = collect($this->getJson("/api/admin/utilisateurs?ecole_id={$b->id}")->assertOk()->json('data'))->pluck('id');

    expect($ids)->toContain($collegue->id)
        ->and($ids)->not->toContain($etranger->id)
        ->and($ids)->not->toContain($super->id)
        ->and($avecFiltre)->not->toContain($etranger->id);
});

it('refuse de lire, désactiver ou supprimer un compte d’une autre école', function () {
    ['etranger' => $etranger] = deuxEcolesAdmin();

    $this->getJson("/api/admin/utilisateurs/{$etranger->id}")->assertNotFound();
    $this->postJson("/api/admin/utilisateurs/{$etranger->id}/toggle-status")->assertNotFound();
    $this->deleteJson("/api/admin/utilisateurs/{$etranger->id}")->assertNotFound();

    expect($etranger->fresh()->is_active)->toBeTrue()
        ->and($etranger->fresh()->deleted_at)->toBeNull();
});

it('ne laisse ni désactiver le super-administrateur ni se désactiver soi-même', function () {
    ['super' => $super, 'admin' => $admin, 'a' => $a] = deuxEcolesAdmin();
    // Un super-administrateur rattaché à l'école reste hors de portée.
    $superLocal = User::factory()->create(['role' => 'super-admin', 'ecole_id' => $a->id, 'is_active' => true]);

    $this->postJson("/api/admin/utilisateurs/{$super->id}/toggle-status")->assertNotFound();
    $this->postJson("/api/admin/utilisateurs/{$superLocal->id}/toggle-status")->assertNotFound();
    $this->postJson("/api/admin/utilisateurs/{$admin->id}/toggle-status")->assertStatus(422);
    $this->deleteJson("/api/admin/utilisateurs/{$admin->id}")->assertStatus(422);

    expect($super->fresh()->is_active)->toBeTrue()
        ->and($superLocal->fresh()->is_active)->toBeTrue()
        ->and($admin->fresh()->is_active)->toBeTrue();
});

it('désactive un compte de l’école et ferme ses sessions, puis le réactive', function () {
    ['collegue' => $collegue] = deuxEcolesAdmin();
    $collegue->createToken('mobile');
    DB::table('sessions')->insert(['id' => 'sess-test', 'user_id' => $collegue->id, 'ip_address' => '127.0.0.1', 'user_agent' => 'test', 'payload' => '', 'last_activity' => time()]);

    $this->postJson("/api/admin/utilisateurs/{$collegue->id}/toggle-status")->assertOk()->assertJsonPath('data.active', false);

    expect($collegue->fresh()->is_active)->toBeFalse()
        ->and($collegue->tokens()->count())->toBe(0)
        ->and(DB::table('sessions')->where('user_id', $collegue->id)->count())->toBe(0);

    $this->postJson("/api/admin/utilisateurs/{$collegue->id}/toggle-status")->assertOk()->assertJsonPath('data.active', true);
});

it('crée un compte du personnel dans son école', function () {
    ['a' => $a] = deuxEcolesAdmin();

    $this->postJson('/api/admin/utilisateurs', ['role' => 'comptable', 'nom' => 'DOSSOU', 'prenom' => 'Ami', 'telephone' => '0197000123'])
        ->assertCreated();

    $cree = User::where('name', 'DOSSOU')->first();
    expect($cree)->not->toBeNull()
        ->and($cree->role)->toBe('comptable')
        ->and((int) $cree->ecole_id)->toBe($a->id);
});

it('ne crée ni administrateur ni super-administrateur', function () {
    deuxEcolesAdmin();

    foreach (['admin', 'super-admin', 'eleve', 'parent'] as $role) {
        $this->postJson('/api/admin/utilisateurs', ['role' => $role, 'nom' => 'X'.$role, 'telephone' => '0197000124'])->assertStatus(422);
    }

    expect(User::where('name', 'like', 'X%')->count())->toBe(0);
});
