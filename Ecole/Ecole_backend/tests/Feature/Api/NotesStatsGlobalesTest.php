<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\User;

/*
 * R-39 (revue web du 16/11/2026) : la page Notes du personnel calculait
 * « Moyenne générale », « Taux de réussite » et « Échecs » sur les seules 50
 * notes de la page affichée, alors que « Total évaluations » comptait tout.
 * L'API renvoie désormais ces statistiques sur l'ensemble des notes visées.
 */

it('donne les statistiques de toutes les notes, pas de la seule page', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id, 'is_active' => true]);
    $eleve = Eleve::factory()->forSchool($ecole)->create();
    $matiere = Matieres::factory()->create(['ecole_id' => $ecole->id]);
    $classe = \App\Models\Classes::factory()->create(['ecole_id' => $ecole->id]);
    $note = fn (float $valeur, float $sur, $date) => Notes::factory()->create([
        'eleve_id' => $eleve->id, 'ecole_id' => $ecole->id, 'matiere_id' => $matiere->id, 'classe_id' => $classe->id,
        'note' => $valeur, 'note_sur' => $sur, 'date_evaluation' => $date,
    ]);
    foreach (range(1, 50) as $i) {
        $note(12, 20, now()->subDays($i % 10));
    }
    // 51ᵉ note, la plus ancienne : hors de la première page. 2/10 = 4/20.
    $note(2, 10, now()->subMonths(3));

    $reponse = $this->actingAs($directeur)->getJson('/api/notes/eleve')->assertOk();

    expect($reponse->json('data.data'))->toHaveCount(50)
        ->and($reponse->json('stats.total'))->toBe(51)
        // (50 × 12 + 4) / 51 = 11,84 ; la page seule aurait donné 12.
        ->and($reponse->json('stats.moyenne'))->toEqual(11.84)
        // 50 réussites sur 51 = 98 % ; la page seule aurait donné 100 %.
        ->and($reponse->json('stats.taux_reussite'))->toBe(98);
});

it('ne calcule aucune statistique sans note', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id, 'is_active' => true]);

    $reponse = $this->actingAs($directeur)->getJson('/api/notes/eleve')->assertOk();

    expect($reponse->json('stats'))->toBe(['total' => 0, 'moyenne' => null, 'taux_reussite' => null]);
});
