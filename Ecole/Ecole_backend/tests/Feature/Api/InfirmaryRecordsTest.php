<?php

use App\Models\ConsultationMedicale;
use App\Models\DossierMedical;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use App\Models\Vaccination;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Infirmerie (lot 6.6) : les champs saisis sont gardés, un dossier par élève.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create();
    $this->actingAs(User::factory()->create(['role' => 'infirmier', 'ecole_id' => $this->ecole->id]));
});

it('garde le traitement d’une consultation', function () {
    $this->postJson('/api/infirmier/consultations', ['eleve_id' => $this->eleve->id, 'motif' => 'Fièvre', 'diagnostic' => 'Paludisme suspecté',
        'traitement' => 'Orienté vers le centre de santé', 'date' => '2026-11-11', 'urgence' => true])->assertCreated();

    expect(ConsultationMedicale::sole()->only(['traitement', 'urgence']))->toBe(['traitement' => 'Orienté vers le centre de santé', 'urgence' => true]);
    expect($this->getJson('/api/infirmier/consultations')->assertOk()->json('data.0.eleve.user.name'))->not->toBeEmpty();
});

it('garde tout le dossier médical et le met à jour au lieu de le dupliquer', function () {
    $dossier = ['eleve_id' => $this->eleve->id, 'contact_urgence' => '0197000001', 'groupe_sanguin' => 'O+', 'allergies' => 'Arachide',
        'maladies_chroniques' => 'Drépanocytose', 'aptitude_sport' => false];

    $this->postJson('/api/infirmier/dossiers-medicaux', $dossier)->assertCreated();
    $this->postJson('/api/infirmier/dossiers-medicaux', ['allergies' => 'Arachide, pénicilline'] + $dossier)->assertOk();

    expect(DossierMedical::count())->toBe(1)
        ->and(DossierMedical::sole()->only(['groupe_sanguin', 'allergies', 'maladies_chroniques']))
        ->toBe(['groupe_sanguin' => 'O+', 'allergies' => 'Arachide, pénicilline', 'maladies_chroniques' => 'Drépanocytose'])
        ->and((bool) DossierMedical::sole()->aptitude_sport)->toBeFalse();
});

it('refuse un groupe sanguin inconnu', function () {
    $this->postJson('/api/infirmier/dossiers-medicaux', ['eleve_id' => $this->eleve->id, 'contact_urgence' => 'x', 'groupe_sanguin' => 'Z'])
        ->assertStatus(422)->assertJsonValidationErrors('groupe_sanguin');
});

it('garde la date de rappel d’une vaccination et refuse un rappel antérieur', function () {
    $base = ['eleve_id' => $this->eleve->id, 'nom_vaccin' => 'Méningite A', 'date_vaccination' => '2026-10-01', 'numero_lot' => 'L123'];

    $this->postJson('/api/infirmier/vaccinations', $base + ['date_rappel' => '2027-10-01'])->assertCreated();
    $this->postJson('/api/infirmier/vaccinations', $base + ['date_rappel' => '2026-09-01'])->assertStatus(422);

    expect(Vaccination::sole()->date_rappel)->not->toBeNull();
});
