<?php

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Series;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Ancien bulletin `GET /bulletins/eleve/{id}/{periode}` (audit du 14/11,
 * N-05). Il répondait 500 à un parent pour son propre enfant (élève sans
 * série) et ne vérifiait pas que l'élève était le sien : un élève avec une
 * série aurait été lisible par n'importe quel parent de l'école.
 */
function familleBulletin(bool $avecSerie = true): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $serie = $avecSerie ? Series::factory()->create(['ecole_id' => $ecole->id]) : null;
    $eleve = Eleve::factory()->forSchool($ecole)->create(['serie_id' => $serie?->id]);
    if ($serie) {
        $serie->matieres()->attach(Matieres::factory()->create(['ecole_id' => $ecole->id])->id, ['classe_id' => $eleve->classe_id, 'coefficient' => 2]);
    }
    $parent = UserParent::factory()->forSchool($ecole)->create();
    $parent->eleves()->attach($eleve->id);

    return [$ecole, $eleve, $parent];
}

it('refuse à un parent le bulletin d’un enfant qui n’est pas le sien', function () {
    [$ecole, $eleve] = familleBulletin();
    $autreParent = UserParent::factory()->forSchool($ecole)->create();

    $this->actingAs($autreParent->user)->getJson("/api/bulletins/eleve/{$eleve->id}/1")->assertForbidden();
});

it('donne au parent le bulletin de son enfant', function () {
    [, $eleve, $parent] = familleBulletin();

    $this->actingAs($parent->user)->getJson("/api/bulletins/eleve/{$eleve->id}/1")->assertOk();
});

it('répond 404, pas 500, pour un élève sans série', function () {
    [, $eleve, $parent] = familleBulletin(false);

    $this->actingAs($parent->user)->getJson("/api/bulletins/eleve/{$eleve->id}/1")->assertNotFound();
});

it('répond 404 pour un élève inconnu', function () {
    [, , $parent] = familleBulletin();

    $this->actingAs($parent->user)->getJson('/api/bulletins/eleve/999999/1')->assertNotFound();
});
