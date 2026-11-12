<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\PaiementEleve;
use App\Models\User;
use App\Support\AnneeScolaire;
use App\Support\Inscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

/*
 * Avis SMS aux parents (lot 7.1) et préférences (7.2). Pilote « journal » :
 * rien n'est envoyé, chaque message est consigné.
 */

beforeEach(function () {
    $this->sms = [];
    Log::listen(function ($m) {
        if (str_starts_with($m->message, 'SMS (journal')) {
            $this->sms[] = $m->context;
        }
    });
    $this->ecole = Ecole::factory()->create(['status' => 'active', 'nom' => 'CEG Test']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->classe->id]);
    $this->actingAs(User::factory()->create(['role' => 'secretaire', 'ecole_id' => $this->ecole->id]));
    Inscription::rattacherParent($this->eleve, ['name' => 'DOSSOU', 'telephone' => '0197000001'], $this->ecole->id);
    $this->parent = User::where('identifiant', '0197000001')->sole();
    $this->parent->forceFill(['password_change_required' => false])->save();
});

it('prévient le parent d’une absence à l’appel, une seule fois si l’appel est rejoué', function () {
    $this->actingAs(User::factory()->create(['role' => 'surveillant', 'ecole_id' => $this->ecole->id]));
    $appel = ['classe_id' => $this->classe->id, 'date' => '2026-11-10', 'eleves' => [['eleve_id' => $this->eleve->id, 'statut' => 'absent']]];

    $this->postJson('/api/surveillant/appel', $appel)->assertOk();
    $this->postJson('/api/surveillant/appel', $appel)->assertOk();

    expect($this->sms)->toHaveCount(1)
        ->and($this->sms[0]['to'])->toBe('+2290197000001')
        ->and($this->sms[0]['message'])->toContain('CEG Test')->toContain('absent(e) le 10/11/2026');
});

it('envoie le reçu d’un encaissement au guichet', function () {
    $echeance = PaiementEleve::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'montant' => 0, 'montant_total' => 60000, 'montant_paye' => 0,
        'montant_restant' => 60000, 'statut_global' => PaiementEleve::PENDING, 'type_paiement' => 'Scolarité', 'mode_paiement' => 'ESPECES', 'date_paiement' => now()]);
    $this->actingAs(User::factory()->create(['role' => 'comptable', 'ecole_id' => $this->ecole->id]));

    $this->postJson("/api/comptable/echeancier/{$echeance->id}/encaisser", ['montant' => 20000, 'mode_paiement' => 'ESPECES'])->assertCreated();

    expect($this->sms[0]['message'])->toContain('20 000 FCFA')->toContain('Reste à payer : 40 000 FCFA');
});

it('annonce le bulletin arrêté', function () {
    $maths = Matieres::factory()->create(['ecole_id' => $this->ecole->id]);
    Notes::create(['eleve_id' => $this->eleve->id, 'classe_id' => $this->classe->id, 'matiere_id' => $maths->id, 'note' => 14, 'note_sur' => 20,
        'type_evaluation' => 'Devoir1', 'date_evaluation' => '2026-11-10', 'periode' => 'Trimestre 1', 'annee_scolaire' => AnneeScolaire::courante()]);
    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->ecole->id]));

    $this->postJson('/api/bulletins/verrouiller', ['classe_id' => $this->classe->id, 'periode' => 'Trimestre 1'])->assertOk();

    expect($this->sms[0]['message'])->toContain('Trimestre 1')->toContain('14,00/20');
});

it('rappelle une échéance à 7 jours', function () {
    PaiementEleve::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'montant' => 0, 'montant_total' => 45000, 'montant_paye' => 0,
        'montant_restant' => 45000, 'statut_global' => PaiementEleve::PENDING, 'type_paiement' => '2e tranche', 'mode_paiement' => 'ESPECES', 'date_paiement' => now()->addDays(7)]);

    $this->artisan('ecole:rappels-echeances')->assertSuccessful();

    expect($this->sms)->toHaveCount(1)->and($this->sms[0]['message'])->toContain('45 000 FCFA')->toContain('2e tranche');
});

it('respecte les préférences du parent, langue comprise', function () {
    $this->actingAs($this->parent)->putJson('/api/parent/preferences', ['absences' => false, 'recus' => true, 'langue' => 'en'])
        ->assertOk()->assertJsonPath('data.absences', false)->assertJsonPath('data.langue', 'en');

    $this->actingAs(User::factory()->create(['role' => 'surveillant', 'ecole_id' => $this->ecole->id]));
    $this->postJson('/api/surveillant/appel', ['classe_id' => $this->classe->id, 'date' => '2026-11-10', 'eleves' => [['eleve_id' => $this->eleve->id, 'statut' => 'absent']]])->assertOk();
    expect($this->sms)->toHaveCount(0);

    $echeance = PaiementEleve::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'montant' => 0, 'montant_total' => 1000, 'montant_paye' => 0,
        'montant_restant' => 1000, 'statut_global' => PaiementEleve::PENDING, 'type_paiement' => 'Cantine', 'mode_paiement' => 'ESPECES', 'date_paiement' => now()]);
    $this->actingAs(User::factory()->create(['role' => 'comptable', 'ecole_id' => $this->ecole->id]));
    $this->postJson("/api/comptable/echeancier/{$echeance->id}/encaisser", ['montant' => 1000, 'mode_paiement' => 'ESPECES'])->assertCreated();
    expect($this->sms[0]['message'])->toContain('payment of 1 000 FCFA received');
});
