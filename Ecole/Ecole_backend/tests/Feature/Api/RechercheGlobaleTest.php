<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Recherche globale (BUG-007, audit du 14/11) : la palette envoie `q` à
 * `/eleves`, `/classes` et `/payments/history`, qui l'ignoraient. Taper
 * « AUDIT » listait les 50 premiers élèves, toutes les classes et les 20
 * derniers paiements, quelle que soit la saisie.
 */
function ecoleDeRecherche(): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $agent = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]);
    test()->actingAs($agent);

    $eleve = fn (string $nom, string $prenom, string $matricule) => tap(Eleve::factory()->forSchool($ecole)->create(['numero_matricule' => $matricule]),
        fn ($e) => $e->user->update(['name' => $nom, 'prenom' => $prenom]));

    return [$ecole, $eleve('AUDITFICTIF', 'Kossi', 'MAT-001'), $eleve('HOUNKPATIN', 'Afi', 'MAT-002')];
}

it('ne renvoie que les élèves dont le nom, le prénom ou le matricule correspond', function () {
    [, $cherche, $autre] = ecoleDeRecherche();

    $ids = fn (string $q) => collect($this->getJson('/api/eleves?q='.urlencode($q))->assertOk()->json('data'))->pluck('id')->all();

    expect($ids('audit'))->toBe([$cherche->id])
        ->and($ids('Afi'))->toBe([$autre->id])
        ->and($ids('MAT-002'))->toBe([$autre->id])
        ->and($ids('Kossi audit'))->toBe([$cherche->id])
        ->and($ids('Kossi HOUNKPATIN'))->toBe([])
        ->and($ids('%'))->toBe([])
        ->and($ids(''))->toHaveCount(2);
});

it('ne renvoie que les classes dont le nom correspond', function () {
    [$ecole] = ecoleDeRecherche();
    Classes::query()->where('ecole_id', $ecole->id)->delete();
    $sixieme = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème A']);
    Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => 'CM2']);

    $noms = collect($this->getJson('/api/classes?q=6')->assertOk()->json('data') ?? $this->getJson('/api/classes?q=6')->json())->pluck('id')->all();

    expect($noms)->toBe([$sixieme->id]);
});

it('ne renvoie que les paiements de l’élève cherché', function () {
    [$ecole, $cherche, $autre] = ecoleDeRecherche();
    $voulu = Payment::factory()->create(['ecole_id' => $ecole->id, 'eleve_id' => $cherche->id]);
    Payment::factory()->create(['ecole_id' => $ecole->id, 'eleve_id' => $autre->id]);

    $ids = collect($this->getJson('/api/payments/history?q=auditfictif')->assertOk()->json('data.data'))->pluck('id')->all();

    expect($ids)->toBe([$voulu->id]);
});
