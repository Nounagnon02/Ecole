<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\TransactionPaiement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Encaissement au guichet (audit BUG-025).
 *
 * La comptabilité ne pouvait encaisser qu'en ligne : « Payer » sur une
 * échéance ouvrait FedaPay. Or l'essentiel des scolarités se règle en espèces.
 * `POST comptable/paiements` crée une nouvelle ligne soldée, il ne crédite pas
 * une échéance existante : le reste dû de l'élève ne baissait jamais.
 */

function guichet(float $total = 60000, float $paye = 0, string $role = 'comptable'): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $agent = User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id]);
    $eleve = Eleve::factory()->forSchool($ecole)->create();
    test()->actingAs($agent);

    $echeance = PaiementEleve::create([
        'eleve_id' => $eleve->id, 'ecole_id' => $ecole->id,
        'montant' => $paye, 'montant_total' => $total, 'montant_paye' => $paye, 'montant_restant' => $total - $paye,
        'statut_global' => $paye > 0 ? PaiementEleve::PARTIAL : PaiementEleve::PENDING,
        'type_paiement' => 'Scolarité', 'mode_paiement' => 'ESPECES', 'date_paiement' => now(),
    ]);

    return [$agent, $eleve, $echeance];
}

function encaisser(PaiementEleve $echeance, array $donnees)
{
    return test()->postJson("/api/comptable/echeancier/{$echeance->id}/encaisser", $donnees);
}

it('crédite l’échéance d’un versement en espèces et le journalise', function () {
    [$agent, , $echeance] = guichet(60000, 10000);

    $reponse = encaisser($echeance, ['montant' => 20000, 'mode_paiement' => 'ESPECES'])->assertCreated();

    expect($reponse->json('data.echeance'))->toMatchArray([
        'montant_paye' => 30000.0, 'reste' => 30000.0, 'statut' => 'partiel',
    ]);
    expect((float) $echeance->fresh()->montant_restant)->toBe(30000.0);

    $versement = TransactionPaiement::where('id_paiement_eleve', $echeance->id)->sole();
    expect((float) $versement->montant_paye)->toBe(20000.0)
        ->and($versement->methode_paiement)->toBe('ESPECES')
        ->and($versement->statut)->toBe(TransactionPaiement::APPROUVE)
        ->and((int) $versement->recu_par)->toBe($agent->id)
        ->and($reponse->json('data.reference'))->toBe($versement->reference_transaction);
});

it('solde l’échéance quand le versement couvre le reste', function () {
    [, , $echeance] = guichet(60000, 10000);

    encaisser($echeance, ['montant' => 50000, 'mode_paiement' => 'CHEQUE', 'reference' => 'CHQ-0042'])
        ->assertCreated()
        ->assertJsonPath('data.echeance.statut', 'payee')
        ->assertJsonPath('data.reference', 'CHQ-0042');

    expect($echeance->fresh()->statut_global)->toBe(PaiementEleve::PAID);
});

it('refuse un versement supérieur au reste dû', function () {
    [, , $echeance] = guichet(60000, 10000);

    encaisser($echeance, ['montant' => 50001, 'mode_paiement' => 'ESPECES'])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Le versement dépasse le reste dû de cette échéance (50 000 FCFA).');

    expect((float) $echeance->fresh()->montant_paye)->toBe(10000.0)
        ->and(TransactionPaiement::count())->toBe(0);
});

it('refuse un montant nul, un mode inconnu et une date future', function (array $donnees, string $champ) {
    [, , $echeance] = guichet();

    encaisser($echeance, $donnees + ['montant' => 1000, 'mode_paiement' => 'ESPECES'])
        ->assertStatus(422)->assertJsonValidationErrors($champ);
})->with([
    'montant nul' => [['montant' => 0], 'montant'],
    'mode inconnu' => [['mode_paiement' => 'TROC'], 'mode_paiement'],
    'date future' => [['date_paiement' => '2999-01-01'], 'date_paiement'],
]);

it('ne laisse pas un enseignant encaisser', function () {
    [, , $echeance] = guichet(60000, 0, 'enseignant');

    encaisser($echeance, ['montant' => 1000, 'mode_paiement' => 'ESPECES'])->assertStatus(403);
});

it('ne voit pas l’échéance d’une autre école', function () {
    [, , $ailleurs] = guichet();
    guichet(); // se connecte comme comptable d'une seconde école

    encaisser($ailleurs, ['montant' => 1000, 'mode_paiement' => 'ESPECES'])->assertStatus(404);
});

it('donne, dans l’échéancier, le dû, le payé et le reste de chaque échéance', function () {
    [, $eleve, $echeance] = guichet(60000, 10000);

    $ligne = $this->getJson("/api/comptable/echeancier/{$eleve->id}")->assertOk()->json('data.echeances.0');

    expect($ligne)->toMatchArray(['id' => $echeance->id, 'montant_total' => 60000.0, 'montant_paye' => 10000.0, 'reste' => 50000.0]);
});

/*
 * Doublons (audit du 14/11, N-01) : deux requêtes simultanées « Encaisser
 * 5 000 F » créditaient 10 000 F (deux onglets, deux agents, envoi rejoué).
 */
it('ne crédite qu’une fois un encaissement envoyé deux fois avec la même clé', function () {
    [, , $echeance] = guichet(60000);
    $donnees = ['montant' => 5000, 'mode_paiement' => 'ESPECES', 'cle_idempotence' => 'cle-test-0001'];

    $r1 = encaisser($echeance, $donnees)->assertCreated();
    $r2 = encaisser($echeance, $donnees)->assertOk();

    expect((float) $echeance->fresh()->montant_paye)->toBe(5000.0)
        ->and(TransactionPaiement::where('id_paiement_eleve', $echeance->id)->count())->toBe(1)
        ->and($r2->json('data.reference'))->toBe($r1->json('data.reference'))
        ->and($r2->json('deja_enregistre'))->toBeTrue();
});

it('traite comme un doublon un encaissement identique du même agent dans les 10 secondes', function () {
    [, , $echeance] = guichet(60000);
    $donnees = ['montant' => 5000, 'mode_paiement' => 'ESPECES'];

    encaisser($echeance, $donnees)->assertCreated();
    encaisser($echeance, $donnees)->assertOk()->assertJsonPath('deja_enregistre', true);

    expect((float) $echeance->fresh()->montant_paye)->toBe(5000.0);
});

it('crédite un second versement identique au-delà de 10 secondes, ou d’un autre montant', function () {
    [, , $echeance] = guichet(60000);

    encaisser($echeance, ['montant' => 5000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    encaisser($echeance, ['montant' => 3000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    \Illuminate\Support\Carbon::setTestNow(now()->addSeconds(11));
    encaisser($echeance, ['montant' => 5000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    \Illuminate\Support\Carbon::setTestNow();

    expect((float) $echeance->fresh()->montant_paye)->toBe(13000.0);
});

/*
 * Reçu d'un versement (audit du 14/11, N-02) : le reçu imprimable donnait le
 * total de l'échéance (74 946 F) comme montant payé et sa date d'échéance,
 * pour un versement partiel.
 */
function versementId(\Illuminate\Testing\TestResponse $reponse): int
{
    return (int) $reponse->json('data.versement_id');
}

it('imprime pour chaque versement le montant reçu, la date, le mode et la situation à ce moment', function () {
    [$agent, , $echeance] = guichet(60000);
    $agent->ecole->update(['phone' => '0121000000']);

    encaisser($echeance, ['montant' => 5000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    $second = versementId(encaisser($echeance, ['montant' => 3000, 'mode_paiement' => 'MOBILE_MONEY'])->assertCreated());
    encaisser($echeance, ['montant' => 2000, 'mode_paiement' => 'ESPECES'])->assertCreated();

    $html = $this->get("/api/comptable/versements/{$second}/recu")->assertOk()->getContent();

    expect($html)->toContain('Montant reçu')
        ->and($html)->toContain('3 000 FCFA')
        ->and($html)->toContain(now()->format('d/m/Y'))
        ->and($html)->toContain('Mobile money')
        ->and($html)->toMatch('/Total dû.*60 000 FCFA/s')
        ->and($html)->toMatch('/Déjà payé.*8 000 FCFA/s')
        ->and($html)->toMatch('/Reste à payer.*52 000 FCFA/s')
        ->and($html)->toContain('0121000000');
});

it('n’imprime pas le reçu d’un versement d’une autre école', function () {
    [, , $echeance] = guichet(60000);
    $id = versementId(encaisser($echeance, ['montant' => 5000, 'mode_paiement' => 'ESPECES'])->assertCreated());

    guichet(60000); // autre école, autre agent connecté
    $this->get("/api/comptable/versements/{$id}/recu")->assertNotFound();
});

it('présente le reçu d’une échéance partielle comme une situation, pas comme un paiement du total', function () {
    [, , $echeance] = guichet(74946);
    encaisser($echeance, ['montant' => 5000, 'mode_paiement' => 'ESPECES'])->assertCreated();

    $html = $this->get("/api/comptable/paiements/{$echeance->id}/recu")->assertOk()->getContent();

    expect($html)->toMatch('/Total dû.*74 946 FCFA/s')
        ->and($html)->toMatch('/Déjà payé.*5 000 FCFA/s')
        ->and($html)->toMatch('/Reste à payer.*69 946 FCFA/s')
        ->and($html)->not->toContain('<div class="amount">74 946 FCFA</div>');
});
