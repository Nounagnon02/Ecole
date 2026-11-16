<?php

use App\Models\Universite\EmploiDuTemps;
use App\Models\Universite\Enseignant;
use App\Models\Universite\Etudiant;
use App\Models\Universite\Filiere;
use App\Models\Universite\Matiere;
use App\Models\Universite\Note;
use App\Models\Universite\Semestre;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Notes universitaires (système LMD), décision du 16/11/2026.
 *
 * Constaté : `GET /universite/notes` renvoyait à tout professeur les notes de
 * tous les étudiants de l'établissement, un professeur pouvait noter dans une
 * UE qu'il n'enseigne pas, et l'étudiant n'avait aucun moyen de voir les
 * siennes. Règles retenues, communes aux universités béninoises : moyenne de
 * semestre pondérée par les crédits, UE validée à 10/20. La part de l'examen
 * face au contrôle continu varie selon l'établissement : réglable
 * (`config/universite.php`), 60 % par défaut.
 */

/** Un établissement, une filière, un semestre, un professeur et un étudiant liés à des comptes. */
function campus(): array
{
    $test = test();
    $ecole = $test->actingInSchool(role: 'recteur');
    $filiere = Filiere::factory()->create();
    $semestre = Semestre::factory()->create(['libelle' => 'S1']);
    $profCompte = User::factory()->create(['role' => 'professeur', 'ecole_id' => $ecole->id, 'is_active' => true]);
    $prof = Enseignant::factory()->forUser($profCompte)->create();
    $etuCompte = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $ecole->id, 'is_active' => true]);
    $etudiant = Etudiant::factory()->forUser($etuCompte)->create(['filiere_id' => $filiere->id]);

    return compact('ecole', 'filiere', 'semestre', 'profCompte', 'prof', 'etuCompte', 'etudiant');
}

function ue(array $c, array $attributs = []): Matiere
{
    return Matiere::factory()->create($attributs + [
        'filiere_id' => $c['filiere']->id, 'semestre_id' => $c['semestre']->id, 'enseignant_id' => $c['prof']->id,
    ]);
}

function noter(Etudiant $etudiant, Matiere $ue, string $type, float $note, string $date = '2026-11-02'): Note
{
    return Note::create(['etudiant_id' => $etudiant->id, 'matiere_id' => $ue->id, 'type' => $type, 'note' => $note, 'date_evaluation' => $date]);
}

/* ─── Relevé de l'étudiant ─────────────────────────────────────────────── */

it('calcule le relevé LMD de l’étudiant : UE, crédits, validation, moyenne pondérée', function () {
    $c = campus();
    $algo = ue($c, ['code' => 'UE101', 'intitule' => 'Algorithmique', 'credit' => 4]);
    $stat = ue($c, ['code' => 'UE102', 'intitule' => 'Statistiques', 'credit' => 2]);
    $droit = ue($c, ['code' => 'UE103', 'intitule' => 'Droit du numérique', 'credit' => 3]);
    noter($c['etudiant'], $algo, 'CC', 12);
    noter($c['etudiant'], $algo, 'TP', 14);
    noter($c['etudiant'], $algo, 'Examen', 10);
    noter($c['etudiant'], $stat, 'CC', 8);
    noter($c['etudiant'], $stat, 'Examen', 9);
    noter($c['etudiant'], $droit, 'CC', 15); // examen pas encore passé

    // Bruit : une UE d'une autre filière et la note d'un camarade.
    $autre = Matiere::factory()->create(['semestre_id' => $c['semestre']->id, 'enseignant_id' => $c['prof']->id]);
    $camarade = Etudiant::factory()->create(['filiere_id' => $c['filiere']->id]);
    noter($camarade, $algo, 'Examen', 20);

    $this->actingAs($c['etuCompte']);
    $releve = $this->getJson('/api/universite/mes-notes')->assertOk()->json('data');

    expect($releve['provisoire'])->toBeTrue()
        ->and($releve['regles'])->toBe(['poids_examen' => 0.6, 'seuil_validation' => 10])
        ->and($releve['etudiant']['matricule'])->toBe($c['etudiant']->matricule)
        ->and($releve['semestres'])->toHaveCount(1);

    $s1 = $releve['semestres'][0];
    $parCode = collect($s1['ues'])->keyBy('code');

    expect($parCode->keys()->all())->toBe(['UE101', 'UE102', 'UE103'])
        ->and($parCode->has($autre->code))->toBeFalse()
        // CC = moyenne(12, 14) = 13 ; UE = 0,4 × 13 + 0,6 × 10 = 11,2
        ->and($parCode['UE101'])->toMatchArray(['controle_continu' => 13.0, 'examen' => 10.0, 'moyenne' => 11.2, 'complete' => true, 'validee' => true])
        // 0,4 × 8 + 0,6 × 9 = 8,6
        ->and($parCode['UE102'])->toMatchArray(['moyenne' => 8.6, 'complete' => true, 'validee' => false])
        // Sans examen : moyenne provisoire, ni validée ni ajournée.
        ->and($parCode['UE103'])->toMatchArray(['controle_continu' => 15.0, 'examen' => null, 'moyenne' => 15.0, 'complete' => false, 'validee' => null])
        // JSON n'écrit pas « 12.0 » : on compare les valeurs, ordre CC, TP, Examen.
        ->and(collect($parCode['UE101']['notes'])->map(fn ($n) => [$n['type'], (float) $n['note']])->all())->toBe([['CC', 12.0], ['TP', 14.0], ['Examen', 10.0]])
        // Semestre : (11,2 × 4 + 8,6 × 2) / 6 = 10,33, sur les seules UE complètes.
        ->and($s1)->toMatchArray(['libelle' => 'S1', 'moyenne' => 10.33, 'credits_total' => 9, 'credits_acquis' => 4, 'complet' => false]);
});

it('suit la part de l’examen réglée par l’établissement', function () {
    $c = campus();
    $algo = ue($c, ['credit' => 3]);
    noter($c['etudiant'], $algo, 'CC', 16);
    noter($c['etudiant'], $algo, 'Examen', 8);
    config(['universite.poids_examen' => 0.7]);

    $this->actingAs($c['etuCompte']);
    // 0,3 × 16 + 0,7 × 8 = 10,4
    expect($this->getJson('/api/universite/mes-notes')->assertOk()->json('data.semestres.0.ues.0.moyenne'))->toBe(10.4);
});

it('répond 404 à un compte étudiant sans dossier, et refuse le relevé aux autres rôles', function () {
    $c = campus();
    $sansDossier = User::factory()->create(['role' => 'etudiant', 'ecole_id' => $c['ecole']->id, 'is_active' => true]);

    $this->actingAs($sansDossier)->getJson('/api/universite/mes-notes')->assertNotFound();
    $this->actingAs($c['profCompte'])->getJson('/api/universite/mes-notes')->assertForbidden();
});

/* ─── Notes côté professeur ────────────────────────────────────────────── */

it('ne liste au professeur que les notes de ses UE', function () {
    $c = campus();
    $mienne = ue($c);
    $collegue = Enseignant::factory()->create();
    $autre = ue($c, ['enseignant_id' => $collegue->id]);
    $n1 = noter($c['etudiant'], $mienne, 'CC', 11);
    noter($c['etudiant'], $autre, 'CC', 17);

    $ids = collect($this->actingAs($c['profCompte'])->getJson('/api/universite/notes')->assertOk()->json('data'))->pluck('id')->all();

    expect($ids)->toBe([$n1->id]);
});

it('refuse au professeur de noter une UE qu’il n’enseigne pas ou un étudiant hors de la filière', function () {
    $c = campus();
    $autre = ue($c, ['enseignant_id' => Enseignant::factory()->create()->id]);
    $mienne = ue($c);
    $horsFiliere = Etudiant::factory()->create();
    $note = ['type' => 'CC', 'note' => 12, 'date_evaluation' => '2026-11-03'];

    $this->actingAs($c['profCompte']);
    $this->postJson('/api/universite/notes', $note + ['etudiant_id' => $c['etudiant']->id, 'matiere_id' => $autre->id])->assertForbidden();
    $this->postJson('/api/universite/notes', $note + ['etudiant_id' => $horsFiliere->id, 'matiere_id' => $mienne->id])->assertUnprocessable();
    $this->postJson('/api/universite/notes', $note + ['etudiant_id' => $c['etudiant']->id, 'matiere_id' => $mienne->id])->assertCreated();

    expect(Note::count())->toBe(1);
});

it('donne la grille d’une évaluation : étudiants de la filière et notes déjà saisies', function () {
    $c = campus();
    $mienne = ue($c, ['code' => 'UE201']);
    $camarade = Etudiant::factory()->create(['filiere_id' => $c['filiere']->id, 'nom' => 'ZINSOU']);
    Etudiant::factory()->create(); // autre filière
    noter($c['etudiant'], $mienne, 'CC', 13.5, '2026-11-03');
    noter($c['etudiant'], $mienne, 'CC', 9, '2026-10-01'); // autre évaluation

    $this->actingAs($c['profCompte']);
    $grille = $this->getJson("/api/universite/matieres/{$mienne->id}/grille?type=CC&date=2026-11-03")->assertOk()->json('data');

    expect($grille['matiere']['code'])->toBe('UE201')
        ->and(collect($grille['etudiants'])->pluck('id')->sort()->values()->all())->toBe(collect([$c['etudiant']->id, $camarade->id])->sort()->values()->all())
        ->and($grille['notes'])->toBe([['etudiant_id' => $c['etudiant']->id, 'note' => 13.5]]);

    $autre = ue($c, ['enseignant_id' => Enseignant::factory()->create()->id]);
    $this->getJson("/api/universite/matieres/{$autre->id}/grille?type=CC&date=2026-11-03")->assertForbidden();
});

it('enregistre une grille en un envoi, remplace sans doublon et refuse tout le lot si un étudiant est hors filière', function () {
    $c = campus();
    $mienne = ue($c);
    $camarade = Etudiant::factory()->create(['filiere_id' => $c['filiere']->id]);
    $lot = ['matiere_id' => $mienne->id, 'type' => 'Examen', 'date_evaluation' => '2026-11-10'];

    $this->actingAs($c['profCompte']);
    $this->postJson('/api/universite/notes/lot', $lot + ['notes' => [
        ['etudiant_id' => $c['etudiant']->id, 'note' => 12],
        ['etudiant_id' => $camarade->id, 'note' => null], // absent de la saisie : ignoré
    ]])->assertOk()->assertJsonPath('enregistrees', 1);

    $this->postJson('/api/universite/notes/lot', $lot + ['notes' => [['etudiant_id' => $c['etudiant']->id, 'note' => 14.5]]])->assertOk();

    expect(Note::where('etudiant_id', $c['etudiant']->id)->pluck('note')->map(fn ($n) => (float) $n)->all())->toBe([14.5]);

    $horsFiliere = Etudiant::factory()->create();
    $this->postJson('/api/universite/notes/lot', $lot + ['notes' => [
        ['etudiant_id' => $camarade->id, 'note' => 11],
        ['etudiant_id' => $horsFiliere->id, 'note' => 11],
    ]])->assertUnprocessable();

    expect(Note::where('etudiant_id', $camarade->id)->exists())->toBeFalse();
});

/* ─── Planning personnel du professeur ─────────────────────────────────── */

it('restreint le planning du professeur à ses séances quand il le demande', function () {
    $c = campus();
    $mienne = ue($c);
    $collegue = Enseignant::factory()->create();
    $a = EmploiDuTemps::factory()->create(['matiere_id' => $mienne->id, 'enseignant_id' => $c['prof']->id, 'filiere_id' => $c['filiere']->id]);
    EmploiDuTemps::factory()->create(['enseignant_id' => $collegue->id]);

    $this->actingAs($c['profCompte']);
    expect(collect($this->getJson('/api/universite/planning?perso=1')->assertOk()->json('data'))->pluck('id')->all())->toBe([$a->id])
        ->and($this->getJson('/api/universite/planning')->json('meta.total'))->toBe(2);
});
