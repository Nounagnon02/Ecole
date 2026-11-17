<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\User;
use App\Models\UserParent;

/*
 * Emploi du temps vu par la famille (revue web du 16/11/2026) : l'élève
 * recevait celui de toute l'école, « Toutes les classes » par défaut, sa
 * classe noyée parmi les vingt autres. Il ne reçoit plus que le sien ; le
 * parent, ceux des classes de ses enfants ; le personnel, inchangé.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->troisieme = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->cp = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->sixieme = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    foreach ([$this->troisieme, $this->cp, $this->sixieme] as $classe) {
        EmploiDuTemps::factory()->create(['ecole_id' => $this->ecole->id, 'classe_id' => $classe->id, 'jour' => 'Lundi', 'heure_debut' => '08:00', 'heure_fin' => '10:00']);
    }
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->troisieme->id]);
});

function classesRecues($reponse): array
{
    return collect($reponse->json('data'))->pluck('classe_id')->unique()->sort()->values()->all();
}

it('ne donne à l’élève que l’emploi du temps de sa classe, jamais celui d’une autre', function () {
    $this->actingAs($this->eleve->user);

    expect(classesRecues($this->getJson('/api/emploi-du-temps')->assertOk()))->toBe([$this->troisieme->id])
        ->and(classesRecues($this->getJson("/api/emploi-du-temps?classe_id={$this->cp->id}")->assertOk()))->toBe([]);
});

it('donne au parent les emplois du temps des classes de ses enfants', function () {
    $parent = UserParent::factory()->forSchool($this->ecole)->create();
    $cadet = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->cp->id]);
    $parent->eleves()->attach([$this->eleve->id, $cadet->id]);

    $this->actingAs($parent->user);

    $attendu = collect([$this->troisieme->id, $this->cp->id])->sort()->values()->all();
    expect(classesRecues($this->getJson('/api/emploi-du-temps')->assertOk()))->toBe($attendu)
        ->and(classesRecues($this->getJson("/api/emploi-du-temps?classe_id={$this->sixieme->id}")->assertOk()))->toBe([]);
});

it('laisse au personnel l’emploi du temps de toute l’école', function () {
    $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $this->ecole->id]);

    $reponse = $this->actingAs($directeur)->getJson('/api/emploi-du-temps')->assertOk();

    expect(classesRecues($reponse))->toHaveCount(3);
});
