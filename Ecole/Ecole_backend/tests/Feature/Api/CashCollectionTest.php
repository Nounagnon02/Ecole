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
