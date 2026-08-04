<?php

namespace Tests\Feature\Api;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * `school_exists:` — existence bounded by the caller's school.
 *
 * Laravel's `exists:` rule queries the raw builder, so it never sees the
 * `BelongsToEcole` global scope. 122 rules across 37 files accepted an id from
 * any establishment on the platform, and because validation *passed*, the write
 * then went through with a foreign key pointing into another tenant.
 *
 * The concrete case: `POST /api/comptable/paiements` validated
 * `exists:eleves,id`, so one school could record a payment against another
 * school's pupil.
 */
class SchoolExistsRuleTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $mine;
    private Ecole $theirs;
    private Classes $myClass;
    private Classes $theirClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mine   = Ecole::factory()->create(['status' => 'active']);
        $this->theirs = Ecole::factory()->create(['status' => 'active']);

        // Created with the scope disabled, so the fixtures exist regardless of
        // who is signed in when the assertions run.
        $this->myClass = Classes::withoutGlobalScopes()->create([
            'nom_classe'       => 'CM2',
            'categorie_classe' => 'Primaire',
            'ecole_id'         => $this->mine->id,
        ]);
        $this->theirClass = Classes::withoutGlobalScopes()->create([
            'nom_classe'       => 'CM2',
            'categorie_classe' => 'Primaire',
            'ecole_id'         => $this->theirs->id,
        ]);
    }

    private function validates($value, string $rule = 'school_exists:classes,id'): bool
    {
        return !Validator::make(['field' => $value], ['field' => $rule])->fails();
    }

    /** @test */
    public function a_record_of_my_own_school_passes()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        $this->assertTrue($this->validates($this->myClass->id));
    }

    /** @test */
    public function a_record_of_another_school_is_refused()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        // The row exists — the built-in `exists:` accepted it. It is simply not
        // mine to reference.
        $this->assertTrue(Classes::withoutGlobalScopes()->whereKey($this->theirClass->id)->exists());
        $this->assertFalse($this->validates($this->theirClass->id));
    }

    /** @test */
    public function a_nonexistent_id_is_refused()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        $this->assertFalse($this->validates(999999));
    }

    /** @test */
    public function absence_is_left_to_the_required_rule()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        // Matching the built-in: `school_exists` says nothing about a missing
        // value, so `nullable|school_exists` keeps working.
        $this->assertTrue($this->validates(null));
        $this->assertTrue($this->validates(''));
    }

    /** @test */
    public function a_user_with_no_resolvable_school_gets_nothing()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => null]));

        // Fails closed, like BelongsToEcole. Anything else would make a
        // school-less account able to reference every establishment.
        $this->assertFalse($this->validates($this->myClass->id));
        $this->assertFalse($this->validates($this->theirClass->id));
    }

    /** @test */
    public function a_platform_super_admin_is_not_confined_to_one_school()
    {
        $this->actingAs(User::factory()->create(['role' => 'super-admin', 'ecole_id' => null]));

        // The one transverse role: it administers every establishment, so both
        // ids must validate.
        $this->assertTrue($this->validates($this->myClass->id));
        $this->assertTrue($this->validates($this->theirClass->id));
    }

    /** @test */
    public function a_platform_table_is_not_filtered_by_school()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        // `ecoles` has no `ecole_id`, so the rule adds no clause and behaves
        // like plain `exists`. That check is made against the live schema, so a
        // table that gains `ecole_id` later is covered with no code change.
        $this->assertTrue($this->validates($this->theirs->id, 'school_exists:ecoles,id'));
    }

    /** @test */
    public function an_unknown_table_is_refused_rather_than_raising()
    {
        $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->mine->id]));

        $this->assertFalse($this->validates(1, 'school_exists:table_qui_nexiste_pas,id'));
    }

    /** @test */
    public function the_rule_is_reachable_through_a_real_endpoint()
    {
        $accountant = User::factory()->create(['role' => 'comptable', 'ecole_id' => $this->mine->id]);
        $theirPupil = \App\Models\Eleve::withoutGlobalScopes()->create([
            'user_id'          => User::factory()->create(['ecole_id' => $this->theirs->id])->id,
            'numero_matricule' => 'THEIR-001',
            'date_naissance'   => '2012-01-01',
            'lieu_naissance'   => 'Cotonou',
            'sexe'             => 'M',
            'class_id'         => $this->theirClass->id,
            'ecole_id'         => $this->theirs->id,
        ]);

        $this->actingAs($accountant)
            ->postJson('/api/comptable/paiements', [
                'eleve_id'      => $theirPupil->id,
                'montant'       => 50000,
                'type_paiement' => 'Scolarité',
                'mode_paiement' => 'ESPECES',
                'date_paiement' => '2026-08-03',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('eleve_id');
    }
}
