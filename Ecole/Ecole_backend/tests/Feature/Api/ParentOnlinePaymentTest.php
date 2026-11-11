<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\Payment;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/*
 * Parcours « le parent voit ce qu'il doit et paie » (audit BUG-003).
 *
 * Le parent n'avait aucune page de paiement : le web l'envoyait sur les routes
 * du comptable, qui lui répondaient 403. L'API savait pourtant déjà ouvrir un
 * encaissement pour un parent (`POST /payments/initialize`). Il manquait, pour
 * en faire un écran, le reste à payer par échéance, l'indication qu'un
 * paiement est déjà en cours, et la garantie qu'on ne paie pas plus que le dû.
 */

function familleAvecEcheance(float $total = 60000, float $paye = 0): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $parent = UserParent::factory()->forSchool($ecole)->create();
    $enfant = Eleve::factory()->forSchool($ecole)->create();
    $parent->eleves()->attach($enfant->id);

    test()->actingAs($parent->user);

    $echeance = PaiementEleve::create([
        'eleve_id' => $enfant->id,
        'ecole_id' => $ecole->id,
        'montant' => $paye,
        'montant_total' => $total,
        'montant_paye' => $paye,
        'montant_restant' => $total - $paye,
        'statut_global' => $paye <= 0 ? PaiementEleve::PENDING : ($paye >= $total ? PaiementEleve::PAID : PaiementEleve::PARTIAL),
        'type_paiement' => 'Scolarité',
        'mode_paiement' => 'MOBILE_MONEY',
        'date_paiement' => now(),
    ]);

    return [$parent, $enfant, $echeance];
}

function passerelleOuvre(string ...$ids): void
{
    $suite = Http::sequence();
    foreach ($ids as $id) {
        $suite->push(['transaction' => ['id' => $id, 'url' => "https://sandbox.fedapay.com/pay/{$id}"]]);
    }
    Http::fake(['sandbox-api.fedapay.com/v1/transactions' => $suite]);
}

function ouvrir(Eleve $enfant, PaiementEleve $echeance, float $montant)
{
    return test()->postJson('/api/payments/initialize', [
        'eleve_id' => $enfant->id,
        'paiement_eleve_id' => $echeance->id,
        'amount' => $montant,
        'description' => 'Scolarité',
        'type' => 'scolarite',
    ]);
}

it('donne au parent, par échéance, le dû, le payé et le reste', function () {
    [, $enfant, $echeance] = familleAvecEcheance(60000, 20000);

    $reponse = $this->getJson("/api/parent/enfants/{$enfant->id}/paiements")->assertOk();

    expect($reponse->json('data.0'))->toMatchArray([
        'id' => $echeance->id,
        'libelle' => 'Scolarité',
        'montant_total' => 60000.0,
        'montant_paye' => 20000.0,
        'reste' => 40000.0,
        'statut' => PaiementEleve::PARTIAL,
        'paiement_en_cours' => null,
    ]);
    expect($reponse->json('meta'))->toMatchArray(['total_du' => 60000.0, 'total_paye' => 20000.0, 'solde' => 40000.0]);
});

it('ouvre un paiement partiel pour son enfant et le signale comme en cours', function () {
    [, $enfant, $echeance] = familleAvecEcheance(60000);
    passerelleOuvre('TX_PARENT_1');

    $ouverture = ouvrir($enfant, $echeance, 25000)->assertOk();

    expect($ouverture->json('success'))->toBeTrue()
        ->and($ouverture->json('data.checkout_url'))->toBe('https://sandbox.fedapay.com/pay/TX_PARENT_1');

    $enCours = $this->getJson("/api/parent/enfants/{$enfant->id}/paiements")->json('data.0.paiement_en_cours');

    expect($enCours)->toMatchArray([
        'montant' => 25000.0,
        'checkout_url' => 'https://sandbox.fedapay.com/pay/TX_PARENT_1',
    ]);
    // Rien n'est crédité tant que la passerelle n'a pas confirmé.
    expect((float) $echeance->fresh()->montant_paye)->toBe(0.0);
});

it('refuse un montant supérieur au reste à payer, sans appeler la passerelle', function () {
    [, $enfant, $echeance] = familleAvecEcheance(60000, 20000);
    Http::fake();

    ouvrir($enfant, $echeance, 40001)
        ->assertStatus(422)
        ->assertJsonPath('message', 'Le montant dépasse le reste à payer de cette échéance (40 000 FCFA).');

    Http::assertNothingSent();
    expect(Payment::count())->toBe(0);
});

it('refuse de payer une échéance déjà soldée', function () {
    [, $enfant, $echeance] = familleAvecEcheance(60000, 60000);
    Http::fake();

    ouvrir($enfant, $echeance, 1000)
        ->assertStatus(422)
        ->assertJsonPath('message', 'Cette échéance est déjà soldée.');

    Http::assertNothingSent();
});

it('ne laisse pas payer deux fois le reste tant qu’un paiement est en cours', function () {
    [, $enfant, $echeance] = familleAvecEcheance(60000);
    passerelleOuvre('TX_A', 'TX_B');

    ouvrir($enfant, $echeance, 50000)->assertOk();

    // 50 000 en cours sur 60 000 : il ne reste que 10 000 à engager.
    ouvrir($enfant, $echeance, 20000)
        ->assertStatus(422)
        ->assertJsonPath('message', 'Un paiement de 50 000 FCFA est déjà en cours sur cette échéance. Terminez-le, ou payez au plus 10 000 FCFA.');

    ouvrir($enfant, $echeance, 10000)->assertOk();

    Http::assertSentCount(2);
    expect(Payment::count())->toBe(2);
});

it('n’ouvre pas de paiement pour l’enfant d’une autre famille', function () {
    familleAvecEcheance();
    $autre = Eleve::factory()->forSchool(Ecole::first())->create();
    Http::fake();

    $this->postJson('/api/payments/initialize', [
        'eleve_id' => $autre->id,
        'amount' => 5000,
        'description' => 'Scolarité',
        'type' => 'scolarite',
    ])->assertStatus(403);

    Http::assertNothingSent();
    $this->getJson("/api/parent/enfants/{$autre->id}/paiements")->assertStatus(404);
});

/*
 * Retour du navigateur. La route est publique : le payeur revient de la
 * passerelle, parfois sans session. Elle redirigeait vers des pages que le web
 * n'a pas, et annonçait « échec » pour un paiement encore en attente.
 */
function retourDePasserelle(string $statutPasserelle): array
{
    [, $enfant, $echeance] = familleAvecEcheance(60000);
    $paiement = Payment::create([
        'eleve_id' => $enfant->id, 'paiement_eleve_id' => $echeance->id, 'ecole_id' => $enfant->ecole_id,
        'amount' => 25000, 'currency' => 'XOF', 'type' => 'scolarite', 'description' => 'Scolarité',
        'status' => 'pending', 'transaction_id' => 'TX_RETOUR',
    ]);
    Http::fake(['sandbox-api.fedapay.com/v1/transactions/TX_RETOUR' => Http::response([
        'transaction' => ['id' => 'TX_RETOUR', 'status' => $statutPasserelle, 'amount' => 2500000],
    ])]);
    auth()->forgetGuards(); // le retour arrive sans session

    return [$paiement, $echeance, test()->get('/api/payments/callback?id=TX_RETOUR')];
}

it('au retour d’un paiement approuvé, crédite l’échéance et renvoie vers la page de retour', function () {
    [$paiement, $echeance, $reponse] = retourDePasserelle('approved');

    $reponse->assertRedirect('http://localhost:3000/paiement/retour?statut=confirme');
    expect(Payment::withoutGlobalScope('ecole')->find($paiement->id)->status)->toBe('completed')
        ->and((float) PaiementEleve::withoutGlobalScopes()->find($echeance->id)->montant_paye)->toBe(25000.0);
});

it('au retour d’un paiement encore en attente, ne l’annonce pas comme échoué', function () {
    [$paiement, , $reponse] = retourDePasserelle('pending');

    $reponse->assertRedirect('http://localhost:3000/paiement/retour?statut=attente');
    expect(Payment::withoutGlobalScope('ecole')->find($paiement->id)->status)->toBe('pending');
});

it('au retour d’un paiement refusé, renvoie vers l’issue « échoué » sans rien créditer', function () {
    [, $echeance, $reponse] = retourDePasserelle('declined');

    $reponse->assertRedirect('http://localhost:3000/paiement/retour?statut=echoue');
    expect((float) PaiementEleve::withoutGlobalScopes()->find($echeance->id)->montant_paye)->toBe(0.0);
});

it('au retour d’une transaction inconnue, renvoie vers l’issue « erreur »', function () {
    $this->get('/api/payments/callback?id=INCONNUE')
        ->assertRedirect('http://localhost:3000/paiement/retour?statut=erreur');
});
