<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Recording a payment.
 *
 * `POST /api/comptable/paiements` answered 500 on every call. It validated
 * `type_paiement` as required and then passed it to `create()`, but `paiements`
 * had no such column:
 *
 *     SQLSTATE[HY000]: table paiements has no column named type_paiement
 *
 * It also never asked for `mode_paiement`, which the table requires and which an
 * accounting entry cannot do without. No interface calls this endpoint yet, so
 * nothing depended on the broken contract — which is also why nobody noticed.
 */
class PaymentRecordingTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private Eleve $pupil;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);

        $this->actingAs(User::factory()->create([
            'role'     => 'comptable',
            'ecole_id' => $this->school->id,
        ]));

        $this->pupil = Eleve::factory()->forSchool($this->school)->create();
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'eleve_id'      => $this->pupil->id,
            'montant'       => 50000,
            'type_paiement' => 'Scolarité 1er trimestre',
            'mode_paiement' => 'MOBILE_MONEY',
            'date_paiement' => '2026-08-03',
        ], $override);
    }

    /** @test */
    public function an_accountant_can_record_a_payment()
    {
        $response = $this->postJson('/api/comptable/paiements', $this->payload())
            ->assertStatus(201);

        $this->assertDatabaseHas('paiements', [
            'eleve_id'      => $this->pupil->id,
            'type_paiement' => 'Scolarité 1er trimestre',
            'mode_paiement' => 'MOBILE_MONEY',
        ]);

        $this->assertSame(50000.0, (float) $response->json('data.montant'));
    }

    /** @test */
    public function the_balance_is_derived_rather_than_left_empty()
    {
        $this->postJson('/api/comptable/paiements', $this->payload(['montant' => 30000]))
            ->assertStatus(201);

        $paiement = PaiementEleve::firstWhere('eleve_id', $this->pupil->id);

        // Leaving these null made every outstanding-balance computation read a
        // missing figure.
        $this->assertSame(30000.0, (float) $paiement->montant_total);
        $this->assertSame(30000.0, (float) $paiement->montant_paye);
        $this->assertSame(0.0, (float) $paiement->montant_restant);
        $this->assertSame(PaiementEleve::PAID, $paiement->statut_global);
    }

    /** @test */
    public function a_reference_is_generated_when_none_is_supplied()
    {
        $this->postJson('/api/comptable/paiements', $this->payload())
            ->assertStatus(201);

        $reference = PaiementEleve::firstWhere('eleve_id', $this->pupil->id)->reference;

        $this->assertNotNull($reference);
        $this->assertStringStartsWith('PAY-', $reference);
    }

    /** @test */
    public function a_supplied_reference_is_kept()
    {
        $this->postJson('/api/comptable/paiements', $this->payload(['reference' => 'FEDA-99887']))
            ->assertStatus(201);

        $this->assertDatabaseHas('paiements', ['reference' => 'FEDA-99887']);
    }

    /** @test */
    public function the_payment_mode_is_required_and_validated()
    {
        // The column is NOT NULL, so omitting it used to fail as a 500 deep in
        // the database rather than as a 422 the client can act on.
        $this->postJson('/api/comptable/paiements', array_diff_key(
            $this->payload(),
            ['mode_paiement' => null]
        ))->assertStatus(422)->assertJsonValidationErrors('mode_paiement');

        $this->postJson('/api/comptable/paiements', $this->payload(['mode_paiement' => 'BITCOIN']))
            ->assertStatus(422)->assertJsonValidationErrors('mode_paiement');
    }

    /** @test */
    public function a_negative_amount_is_refused()
    {
        $this->postJson('/api/comptable/paiements', $this->payload(['montant' => -1000]))
            ->assertStatus(422)->assertJsonValidationErrors('montant');
    }

    /** @test */
    public function a_pupil_from_another_school_cannot_be_charged()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);

        // Built outside the accountant's session so the tenant scope does not
        // hide it during creation.
        $theirPupil = $this->withoutTenantScope(
            fn() => Eleve::factory()->forSchool($otherSchool)->create()
        );

        $this->postJson('/api/comptable/paiements', $this->payload(['eleve_id' => $theirPupil->id]))
            ->assertStatus(422)->assertJsonValidationErrors('eleve_id');
    }

    /**
     * Run a closure as an unrestricted user of another school.
     */
    private function withoutTenantScope(callable $callback)
    {
        $accountant = auth()->user();

        $this->actingAs(User::factory()->create([
            'role'     => 'directeur',
            'ecole_id' => Ecole::latest('id')->first()->id,
        ]));

        $result = $callback();

        $this->actingAs($accountant);

        return $result;
    }
}
