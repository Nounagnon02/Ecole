<?php

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\EnseignantMatiere;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Notification;
use App\Models\PaiementEleve;
use App\Models\Series;
use App\Models\User;
use App\Support\Inscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

/*
 * « Ce qui demande une décision » (recommandation D8) : trois listes pour la
 * direction — impayés par classe, notes non saisies, absences non justifiées —
 * chacune avec une relance. Pilote SMS « journal » : rien n'est envoyé.
 */

beforeEach(function () {
    $this->sms = [];
    Log::listen(function ($m) {
        if (str_starts_with($m->message, 'SMS (journal')) {
            $this->sms[] = $m->context;
        }
    });
    $this->ecole = Ecole::factory()->create(['status' => 'active', 'nom' => 'CEG Test']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id, 'nom_classe' => '6e A']);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->classe->id]);
    $this->directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->ecole->id]);
    $this->actingAs($this->directeur);
    Inscription::rattacherParent($this->eleve, ['name' => 'DOSSOU', 'telephone' => '0197000001'], $this->ecole->id);
});

function echeance(array $attributs): PaiementEleve
{
    return PaiementEleve::create(array_merge([
        'eleve_id' => test()->eleve->id, 'ecole_id' => test()->ecole->id, 'montant' => 0, 'montant_total' => 30000,
        'montant_paye' => 0, 'montant_restant' => 30000, 'statut_global' => PaiementEleve::PENDING,
        'type_paiement' => '1re tranche', 'mode_paiement' => 'ESPECES', 'date_paiement' => now()->subDays(5),
    ], $attributs));
}

function affectation(string $matiere): EnseignantMatiere
{
    $user = User::factory()->create(['role' => 'enseignant', 'ecole_id' => test()->ecole->id, 'name' => 'AGBO', 'prenom' => 'Paul']);
    $enseignant = Enseignant::factory()->create(['user_id' => $user->id, 'ecole_id' => test()->ecole->id]);
    $m = Matieres::factory()->create(['ecole_id' => test()->ecole->id, 'nom' => $matiere]);

    $serie = Series::factory()->create(['ecole_id' => test()->ecole->id]);

    return EnseignantMatiere::create(['enseignant_id' => $enseignant->id, 'matiere_id' => $m->id, 'classe_id' => test()->classe->id,
        'serie_id' => $serie->id, 'ecole_id' => test()->ecole->id]);
}

it('liste les impayés échus par classe, sans les échéances à venir ni soldées', function () {
    echeance([]);
    echeance(['montant_restant' => 10000, 'montant_total' => 10000, 'type_paiement' => 'Cantine']);
    echeance(['date_paiement' => now()->addDays(10), 'type_paiement' => 'À venir']);
    echeance(['montant_restant' => 0, 'montant_paye' => 30000, 'statut_global' => PaiementEleve::PAID, 'type_paiement' => 'Soldée']);

    $this->getJson('/api/directeur/decisions')
        ->assertOk()
        ->assertJsonPath('impayes.0.classe', '6e A')
        ->assertJsonPath('impayes.0.eleves', 1)
        ->assertJsonPath('impayes.0.montant_du', 40000)
        ->assertJsonCount(1, 'impayes');
});

it('liste les affectations sans note saisie depuis 30 jours', function () {
    $sansNote = affectation('Mathématiques');
    $ancienne = affectation('Français');
    $recente = affectation('SVT');
    foreach ([[$ancienne, now()->subDays(45)], [$recente, now()->subDays(3)]] as [$a, $date]) {
        $note = Notes::create(['eleve_id' => $this->eleve->id, 'classe_id' => $this->classe->id, 'matiere_id' => $a->matiere_id, 'note' => 12,
            'note_sur' => 20, 'type_evaluation' => 'Devoir1', 'date_evaluation' => $date, 'periode' => 'Trimestre 1']);
        $note->forceFill(['created_at' => $date])->save();
    }

    $matieres = collect($this->getJson('/api/directeur/decisions')->assertOk()->json('notes_manquantes'))->pluck('matiere');

    expect($matieres->sort()->values()->all())->toBe(['Français', 'Mathématiques']);
});

it('liste les absences non justifiées des 30 derniers jours, par élève', function () {
    foreach ([[now()->subDays(2), false], [now()->subDays(9), false], [now()->subDays(4), true], [now()->subDays(60), false]] as [$date, $justifiee]) {
        Absence::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'date' => $date, 'type' => 'absence', 'justifiee' => $justifiee]);
    }

    $this->getJson('/api/directeur/decisions')
        ->assertOk()
        ->assertJsonCount(1, 'absences')
        ->assertJsonPath('absences.0.eleve_id', $this->eleve->id)
        ->assertJsonPath('absences.0.absences', 2)
        ->assertJsonPath('absences.0.classe', '6e A');
});

it('relance les parents d’une classe en retard, une seule fois par jour', function () {
    echeance([]);

    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'impayes', 'id' => $this->classe->id])
        ->assertOk()->assertJsonPath('envoyes', 1);
    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'impayes', 'id' => $this->classe->id])
        ->assertStatus(409);

    expect($this->sms)->toHaveCount(1)
        ->and($this->sms[0]['to'])->toBe('+2290197000001')
        ->and($this->sms[0]['message'])->toContain('30 000 FCFA')->toContain('1re tranche');
});

it('relance l’enseignant par une notification dans l’application', function () {
    $a = affectation('Mathématiques');

    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'notes', 'id' => $a->id])->assertOk();

    $notification = Notification::where('user_id', $a->enseignant->user_id)->sole();
    expect($notification->message)->toContain('Mathématiques')->toContain('6e A');
    expect($this->sms)->toBeEmpty();
});

it('demande aux parents de justifier les absences', function () {
    Absence::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'date' => now()->subDay(), 'type' => 'absence', 'justifiee' => false]);

    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'absences', 'id' => $this->eleve->id])->assertOk();

    expect($this->sms)->toHaveCount(1)->and($this->sms[0]['message'])->toContain('1 absence');
});

it('est réservé à la direction et cloisonné par école', function () {
    $this->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->ecole->id]));
    $this->getJson('/api/directeur/decisions')->assertForbidden();

    $autre = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $autre->id]));
    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'impayes', 'id' => $this->classe->id])->assertNotFound();
    expect($this->sms)->toBeEmpty();
});

it('crée la table de la file d’attente, nécessaire aux avis SMS en production', function () {
    // La configuration de production met les SMS en file dans la base
    // (QUEUE_CONNECTION=database) : sans table `jobs`, chaque avis faisait
    // répondre 500 à l'action qui l'envoyait (appel, bulletin, encaissement…).
    expect(Schema::hasTable('jobs'))->toBeTrue();
});

it('ne fait pas échouer l’action quand la mise en file d’un SMS échoue', function () {
    echeance([]);
    config(['queue.default' => 'database', 'queue.connections.database.table' => 'file_absente']);

    $this->postJson('/api/directeur/decisions/relancer', ['type' => 'impayes', 'id' => $this->classe->id])
        ->assertOk()->assertJsonPath('envoyes', 0);
});
