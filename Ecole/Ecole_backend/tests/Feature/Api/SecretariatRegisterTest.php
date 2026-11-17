<?php

use App\Models\Certificat;
use App\Models\Classes;
use App\Models\Courrier;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use App\Support\Inscription;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Secrétariat (lot 6.5) : registre du courrier, dossiers des élèves,
 * certificats.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'secretaire', 'ecole_id' => $this->ecole->id]));
});

function courrier(array $extra = [])
{
    return test()->postJson('/api/secretaire/courriers', $extra + [
        'type' => 'entrant', 'expediteur' => 'Direction départementale', 'destinataire' => 'Directeur',
        'objet' => 'Calendrier des examens', 'date_reception' => '2026-11-10',
    ]);
}

it('enregistre le courrier avec un numéro d’ordre par sens et le liste', function () {
    courrier()->assertCreated()->assertJsonPath('data.reference', 'A-'.now()->year.'-0001');
    courrier()->assertCreated()->assertJsonPath('data.reference', 'A-'.now()->year.'-0002');
    courrier(['type' => 'sortant', 'expediteur' => 'Directeur', 'destinataire' => 'Parents'])
        ->assertCreated()->assertJsonPath('data.reference', 'D-'.now()->year.'-0001');

    expect($this->getJson('/api/secretaire/courriers')->assertOk()->json('data'))->toHaveCount(3)
        ->and($this->getJson('/api/secretaire/courriers?type=sortant')->json('data'))->toHaveCount(1);
});

it('refuse un courrier daté dans le futur ou sans objet', function () {
    courrier(['date_reception' => now()->addDay()->toDateString()])->assertStatus(422);
    courrier(['objet' => ''])->assertStatus(422);
    expect(Courrier::count())->toBe(0);
});

it('donne dans les dossiers le nom et le téléphone du parent de référence', function () {
    $classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $eleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $classe->id]);
    Inscription::rattacherParent($eleve, ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '0197000001'], $this->ecole->id);

    $dossier = collect($this->getJson('/api/secretaire/dossiers-eleves')->assertOk()->json('data'))->firstWhere('id', $eleve->id);

    expect($dossier)->toMatchArray(['nom_parent' => 'DOSSOU Koffi', 'telephone_parent' => '+2290197000001', 'dossier_complet' => true]);
});

it('établit un certificat numéroté et le délivre', function () {
    $eleve = Eleve::factory()->forSchool($this->ecole)->create();

    $reponse = $this->postJson('/api/secretaire/certificats', ['type_certificat' => 'scolarite', 'eleve_id' => $eleve->id, 'date_emission' => '2026-11-12'])
        ->assertCreated();
    expect($reponse->json('numero_certificat'))->toStartWith('CERT-')
        ->and($reponse->json('eleve.user.name'))->not->toBeEmpty();

    $this->putJson('/api/secretaire/certificats/'.$reponse->json('id').'/delivrer')->assertOk();
    expect((bool) Certificat::sole()->delivre)->toBeTrue();
});
