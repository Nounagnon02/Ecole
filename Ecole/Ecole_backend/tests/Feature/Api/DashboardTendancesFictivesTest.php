<?php

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/*
 * Tendances fictives des tableaux de bord du personnel (recette Windows du
 * 16/11/2026) : chaque chiffre portait « — 0 % », une tendance écrite en dur
 * (`'trend' => 0`) et jamais calculée. L'administrateur voyait en outre un
 * nombre de nouveaux comptes affiché comme un pourcentage (« 3 % »).
 */

beforeEach(function () {
    Cache::flush();
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
});

dataset('roles du personnel', ['comptable', 'secretaire', 'surveillant', 'censeur', 'infirmier', 'bibliothecaire', 'admin']);

it('n’affiche aucune tendance non calculée sur le tableau de bord', function (string $role) {
    $user = User::factory()->create(['role' => $role, 'ecole_id' => $this->ecole->id, 'is_active' => true]);

    $stats = $this->actingAs($user)->getJson("/api/dashboard/{$role}")->assertOk()->json('data.stats');

    expect($stats)->toBeArray()->not->toBeEmpty();
    foreach ($stats as $stat) {
        expect($stat)->not->toHaveKey('trend');
    }
})->with('roles du personnel');

it('donne à l’administrateur le nombre de nouveaux comptes en clair, pas en pourcentage', function () {
    $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $this->ecole->id, 'is_active' => true]);
    User::factory()->count(2)->create(['ecole_id' => $this->ecole->id, 'created_at' => now()->subDays(2)]);

    $stats = $this->actingAs($admin)->getJson('/api/dashboard/admin')->assertOk()->json('data.stats');

    expect($stats[0]['trendLabel'])->toMatch('/^\+\d+ nouveaux? sur 7 jours$/');
});
