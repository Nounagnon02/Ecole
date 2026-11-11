<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\PaiementEleve;
use App\Models\User;
use App\Models\UserParent;
use App\Support\Inscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Fiche de l'élève (lot 4.2) et modification par le secrétariat.
 */

function dossier(string $role = 'secretaire'): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $agent = User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id]);
    test()->actingAs($agent);
    $eleve = Eleve::factory()->forSchool($ecole)->create(['classe_id' => $classe->id, 'numero_matricule' => 'BEN1']);
    Inscription::rattacherParent($eleve, ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '0197000001'], $ecole->id);
    Inscription::rattacherParent($eleve, ['name' => 'DOSSOU', 'prenom' => 'Ama', 'telephone' => '0197000002'], $ecole->id);

    foreach ([[12, 20], [5, 10], [0, 0]] as [$note, $sur]) {
        DB::table('notes')->insert(['ecole_id' => $ecole->id, 'eleve_id' => $eleve->id, 'classe_id' => $classe->id,
            'matiere_id' => Matieres::factory()->create(['ecole_id' => $ecole->id])->id,
            'note' => $note, 'note_sur' => $sur, 'type_evaluation' => 'Devoir1', 'date_evaluation' => now(), 'periode' => 'Trimestre 1',
            'created_at' => now(), 'updated_at' => now()]);
    }
    foreach ([true, false, false] as $justifiee) {
        DB::table('absences')->insert(['ecole_id' => $ecole->id, 'eleve_id' => $eleve->id, 'date' => now(), 'type' => 'absence', 'justifiee' => $justifiee, 'created_at' => now(), 'updated_at' => now()]);
    }
    PaiementEleve::create(['eleve_id' => $eleve->id, 'ecole_id' => $ecole->id, 'montant' => 20000, 'montant_total' => 60000, 'montant_paye' => 20000,
        'montant_restant' => 40000, 'statut_global' => PaiementEleve::PARTIAL, 'type_paiement' => 'Scolarité', 'mode_paiement' => 'ESPECES', 'date_paiement' => now()]);

    return [$ecole, $classe, $eleve];
}

it('réunit identité, parents et résumé de scolarité', function () {
    [, $classe, $eleve] = dossier();

    $fiche = $this->getJson("/api/eleves/{$eleve->id}/fiche")->assertOk()->json('data');

    expect($fiche['eleve'])->toMatchArray(['id' => $eleve->id, 'numero_matricule' => 'BEN1', 'classe' => ['id' => $classe->id, 'nom' => '6ème']])
        // Le contact de référence d'abord.
        ->and($fiche['parents'])->toBe([
            ['nom' => 'DOSSOU Koffi', 'telephone' => '+2290197000001', 'principal' => true],
            ['nom' => 'DOSSOU Ama', 'telephone' => '+2290197000002', 'principal' => false],
        ])
        // 12/20 et 5/10 → 12 et 10 sur 20 ; la note sur 0 est ignorée.
        ->and($fiche['scolarite'])->toEqual(['notes' => 2, 'moyenne' => 11.0, 'absences' => 3, 'absences_non_justifiees' => 2])
        ->and($fiche['paiements'])->toEqual(['total_du' => 60000.0, 'total_paye' => 20000.0, 'reste' => 40000.0]);
});

it('ne montre pas les montants à la surveillance, et les montre au comptable', function () {
    [$ecole, , $eleve] = dossier('surveillant');
    expect($this->getJson("/api/eleves/{$eleve->id}/fiche")->assertOk()->json('data.paiements'))->toBeNull();

    $this->actingAs(User::factory()->create(['role' => 'comptable', 'ecole_id' => $ecole->id]));
    expect($this->getJson("/api/eleves/{$eleve->id}/fiche")->assertOk()->json('data.paiements.reste'))->toEqual(40000);
});

it('refuse la fiche à une autre famille et à une autre école', function () {
    [$ecole, , $eleve] = dossier();

    $autreParent = User::factory()->create(['role' => 'parent', 'ecole_id' => $ecole->id]);
    UserParent::create(['user_id' => $autreParent->id, 'ecole_id' => $ecole->id]);
    $this->actingAs($autreParent)->getJson("/api/eleves/{$eleve->id}/fiche")->assertStatus(403);

    $ailleurs = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ailleurs->id]))
        ->getJson("/api/eleves/{$eleve->id}/fiche")->assertStatus(404);
});

it('laisse le secrétariat corriger le nom, la classe et le matricule', function () {
    [$ecole, , $eleve] = dossier();
    $cinquieme = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '5ème']);

    $this->putJson("/api/eleves/update/{$eleve->id}", ['name' => 'DOSSOU', 'prenom' => 'Afiwa', 'classe_id' => $cinquieme->id, 'numero_matricule' => 'BEN2'])
        ->assertOk();

    $eleve->refresh();
    expect($eleve->user->prenom)->toBe('Afiwa')->and($eleve->classe_id)->toBe($cinquieme->id)->and($eleve->numero_matricule)->toBe('BEN2');

    $this->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]))
        ->putJson("/api/eleves/update/{$eleve->id}", ['prenom' => 'X'])->assertStatus(403);
});
