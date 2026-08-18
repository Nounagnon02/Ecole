<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\StatutTranche;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `statut_tranches` porte la date limite du plan de tranches : l'accesseur
 * `est_en_retard` vit ici, et non sur `transaction_paiements` (les règlements
 * n'ont pas de date limite — un ancien accesseur lisait `date_limite` sur
 * cette table, absente, et renvoyait toujours faux).
 */
class StatutTrancheRetardTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
    }

    private function tranche(array $attributes = []): StatutTranche
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create();
        $paiement = PaiementEleve::factory()->create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'statut_global' => PaiementEleve::PENDING,
        ]);

        return StatutTranche::create(array_merge([
            'ecole_id' => $this->school->id,
            'id_paiement_eleve' => $paiement->id,
            'tranche' => 'Tranche 1',
            'statut' => StatutTranche::EN_ATTENTE,
            'date_limite' => now()->subDay(),
            'montant_tranche' => 50000,
        ], $attributes));
    }

    /** @test */
    public function une_tranche_attendue_avec_date_limite_depassee_est_en_retard()
    {
        $this->assertTrue($this->tranche()->est_en_retard);
    }

    /** @test */
    public function une_tranche_attendue_pas_encore_echue_n_est_pas_en_retard()
    {
        $this->assertFalse($this->tranche(['date_limite' => now()->addDay()])->est_en_retard);
    }

    /** @test */
    public function une_tranche_payee_echue_n_est_pas_en_retard()
    {
        $this->assertFalse($this->tranche(['statut' => StatutTranche::PAYE])->est_en_retard);
    }

    /** @test */
    public function une_tranche_sans_date_limite_n_est_pas_en_retard()
    {
        $this->assertFalse($this->tranche(['date_limite' => null])->est_en_retard);
    }
}
