<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\Payment;
use App\Models\TransactionPaiement;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/*
 * R-41 (recette Windows du 16/11/2026) : le comptable lisait des chiffres
 * contradictoires. « Revenus du mois » ne comptait que les échéances soldées,
 * via la colonne `montant`, et ignorait les versements partiels ; « Taux
 * recouvrement » était une part de LIGNES (35 %) quand Factures montrait la
 * part des MONTANTS (68 %). Mêmes sources désormais que le directeur (R-26)
 * et que la page Factures.
 */

beforeEach(function () {
    Cache::flush();
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->comptable = User::factory()->create(['role' => 'comptable', 'ecole_id' => $this->ecole->id, 'is_active' => true]);
    $eleve = Eleve::factory()->forSchool($this->ecole)->create();
    $echeance = fn (array $m) => PaiementEleve::factory()->create(array_merge(['ecole_id' => $this->ecole->id, 'eleve_id' => $eleve->id, 'date_paiement' => now()], $m));
    // Soldée par « Nouveau paiement » (aucune transaction : `storePaiement`
    // crée l'échéance déjà payée) et partielle (`montant` différent du payé).
    $echeance(['montant' => 100000, 'montant_total' => 100000, 'montant_paye' => 100000, 'montant_restant' => 0, 'statut_global' => PaiementEleve::PAID]);
    $partielle = $echeance(['montant' => 45000, 'montant_total' => 50000, 'montant_paye' => 20000, 'montant_restant' => 30000, 'statut_global' => PaiementEleve::PARTIAL]);

    $versement = fn (float $montant, $date, string $statut = TransactionPaiement::APPROUVE) => (new TransactionPaiement)->forceFill([
        'id_paiement_eleve' => $partielle->id, 'ecole_id' => $this->ecole->id, 'tranche' => 'Scolarité',
        'montant_paye' => $montant, 'date_paiement' => $date, 'statut' => $statut, 'methode_paiement' => 'ESPECES',
        'reference_transaction' => 'REF-'.uniqid(), 'recu_par' => $this->comptable->id,
    ])->save();
    $versement(20000, now());                                  // partiel, ce mois : compté
    $versement(7000, now()->subMonths(2));                     // autre mois : non compté ce mois
    $versement(9000, now(), TransactionPaiement::EN_ATTENTE);  // non confirmé : jamais compté
    Payment::factory()->complete()->create(['ecole_id' => $this->ecole->id, 'eleve_id' => $eleve->id, 'amount' => 15000]);
});

function statComptable(array $stats, string $titre): array
{
    return collect($stats)->firstWhere('title', $titre) ?? [];
}

it('compte dans les revenus du mois tous les versements reçus, partiels et directs compris', function () {
    $data = $this->actingAs($this->comptable)->getJson('/api/dashboard/comptable')->assertOk()->json('data');

    // 20 000 en caisse + 15 000 en ligne + 100 000 saisis par « Nouveau
    // paiement » ; le versement partiel déjà en caisse n'est pas compté deux fois.
    expect(statComptable($data['stats'], 'Revenus du Mois')['value'])->toBe('135 000 F')
        ->and(collect($data['donnes_ca'])->last()['revenus'])->toEqual(135000)
        ->and($data['tresorerie']['encaissements_mois'])->toEqual(135000);
});

it('donne au directeur le même encaissé du mois que au comptable', function () {
    $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->ecole->id, 'is_active' => true]);

    expect($this->actingAs($directeur)->getJson('/api/dashboard/directeur/data')->assertOk()->json('data.finances.revenus_mois'))->toEqual(135000);
});

it('calcule le taux de recouvrement sur les montants, comme la page Factures', function () {
    $stat = statComptable($this->actingAs($this->comptable)->getJson('/api/dashboard/comptable')->json('data.stats'), 'Taux Recouvrement');

    // (100 000 + 20 000) payés sur 150 000 dus = 80 % ; la part de lignes soldées aurait donné 50 %.
    expect($stat['value'])->toBe('80%')
        ->and($stat['trendLabel'])->toBe('des montants dus');
});
