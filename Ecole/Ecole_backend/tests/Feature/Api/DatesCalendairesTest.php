<?php

use App\Models\Absence;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\UserParent;
use Illuminate\Support\Carbon;

/*
 * R-32 (recette du 14/11/2026) : les dates sans heure (absence, note,
 * échéance…) sortaient de l'API à minuit de Porto-Novo exprimé en UTC, soit
 * « 2026-11-15T23:00:00.000000Z » pour le 16/11 : tout client qui lit les dix
 * premiers caractères affichait la veille. Elles sortent désormais en jour
 * calendaire, que la réponse vienne du modèle ou d'un tableau construit à la
 * main par le contrôleur.
 */

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-16 10:00', 'Africa/Porto-Novo'));
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create();
    $this->parent = UserParent::factory()->forSchool($this->ecole)->create();
    $this->parent->eleves()->attach($this->eleve->id);
});

afterEach(fn () => Carbon::setTestNow());

it('rend la date d’une absence en jour calendaire au parent', function () {
    Absence::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'date' => '2026-11-16', 'type' => 'absence']);

    $this->actingAs($this->parent->user)->getJson("/api/parent/enfants/{$this->eleve->id}/absences")
        ->assertOk()->assertJsonPath('data.0.date', '2026-11-16');
});

it('rend la date d’évaluation d’une note en jour calendaire, au parent comme dans le modèle', function () {
    $note = Notes::factory()->create([
        'eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'date_evaluation' => '2026-11-16',
        'matiere_id' => Matieres::factory()->create(['ecole_id' => $this->ecole->id])->id,
    ]);

    $this->actingAs($this->parent->user)->getJson("/api/parent/enfants/{$this->eleve->id}/notes")
        ->assertOk()->assertJsonPath('data.0.date', '2026-11-16');
    expect($note->fresh()->toArray()['date_evaluation'])->toBe('2026-11-16')
        // Toujours une date : comparaisons et calculs inchangés.
        ->and($note->fresh()->date_evaluation->isSameDay(Carbon::parse('2026-11-16')))->toBeTrue();
});

it('ne laisse aucun modèle déclarer une date seule sérialisée en UTC', function () {
    $fautifs = collect(glob(app_path('Models/{,*/}*.php'), GLOB_BRACE))
        ->filter(fn ($f) => preg_match("/=>\\s*'(immutable_)?date'/", file_get_contents($f)))
        ->map(fn ($f) => str_replace(app_path().'/', '', $f))->values()->all();

    expect($fautifs)->toBe([]);
});
