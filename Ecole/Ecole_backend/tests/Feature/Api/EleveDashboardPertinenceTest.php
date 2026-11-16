<?php

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\EmploiDuTemps;
use App\Models\Matieres;
use App\Models\Notes;
use App\Models\Series;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/*
 * Pertinence du tableau de bord de l'élève (revue web du 16/11/2026).
 *
 * « Moyenne générale » était la moyenne brute de toutes les notes de l'année,
 * sans coefficient ni période ; les coefficients venaient d'une table vide en
 * recette (`coefficient_matieres`) au lieu de ceux du bulletin ; « Absences ce
 * mois » comptait les retards ; et « Prochains cours » prenait les cinq
 * premiers créneaux d'un tri alphabétique des jours (jeudi avant lundi).
 */

beforeEach(function () {
    Cache::flush();
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->serie = Series::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create([
        'classe_id' => $this->classe->id, 'serie_id' => $this->serie->id,
    ]);
});

function matiereAvecCoefficient($test, string $nom, float $coefficient): Matieres
{
    $matiere = Matieres::factory()->create(['ecole_id' => $test->ecole->id, 'nom' => $nom]);
    DB::table('serie_matieres')->insert([
        'ecole_id' => $test->ecole->id, 'serie_id' => $test->serie->id, 'classe_id' => $test->classe->id,
        'matiere_id' => $matiere->id, 'coefficient' => $coefficient, 'created_at' => now(), 'updated_at' => now(),
    ]);

    return $matiere;
}

function noteEleve($test, Matieres $matiere, float $note, string $periode, array $autres = []): void
{
    Notes::factory()->create(array_merge([
        'eleve_id' => $test->eleve->id, 'matiere_id' => $matiere->id, 'classe_id' => $test->classe->id,
        'ecole_id' => $test->ecole->id, 'note' => $note, 'note_sur' => 20, 'periode' => $periode,
        'type_evaluation' => 'Devoir1', 'date_evaluation' => now(),
    ], $autres));
}

it('affiche la moyenne de la dernière période, pondérée comme le bulletin', function () {
    $maths = matiereAvecCoefficient($this, 'Mathématiques', 4);
    $francais = matiereAvecCoefficient($this, 'Français', 1);
    // Période précédente : ne compte pas dans la moyenne provisoire en cours.
    noteEleve($this, $francais, 2, 'trimestre1', ['date_evaluation' => now()->subMonths(2)]);
    noteEleve($this, $maths, 10, 'trimestre2');
    noteEleve($this, $francais, 20, 'trimestre2');
    // Note sur 40 : ramenée sur 20 comme au bulletin (30/40 = 15/20) ; la
    // moyenne de la matière est celle des types d'évaluation (10 et 15).
    noteEleve($this, $maths, 30, 'trimestre2', ['note_sur' => 40, 'type_evaluation' => 'Devoir2']);

    $reponse = $this->actingAs($this->eleve->user)->getJson('/api/dashboard/eleve')->assertOk();

    // (12,5 × 4 + 20 × 1) / 5 = 14 ; la moyenne brute aurait donné 15,5.
    expect($reponse->json('data.stats.moyenne_generale'))->toEqual(14)
        ->and($reponse->json('data.stats.periode'))->toBe('trimestre2')
        // « Total notes » : toutes les notes de l'année (4), pas seulement la période.
        ->and($reponse->json('data.stats.total_notes'))->toBe(4);
    $parNom = collect($reponse->json('data.matieres'))->keyBy('name');
    expect($parNom['Mathématiques']['note'])->toEqual(12.5)
        ->and($parNom['Mathématiques']['coeff'])->toEqual(4)
        ->and($parNom['Français']['note'])->toEqual(20);
});

it('n’affiche aucune moyenne sans note', function () {
    $reponse = $this->actingAs($this->eleve->user)->getJson('/api/dashboard/eleve')->assertOk();

    expect($reponse->json('data.stats.moyenne_generale'))->toBeNull()
        ->and($reponse->json('data.stats.periode'))->toBeNull();
});

it('compte les absences du mois à part des retards', function () {
    foreach (['absence', 'retard', 'retard'] as $type) {
        Absence::create(['eleve_id' => $this->eleve->id, 'ecole_id' => $this->ecole->id, 'date' => now(), 'type' => $type]);
    }

    $reponse = $this->actingAs($this->eleve->user)->getJson('/api/dashboard/eleve')->assertOk();

    expect($reponse->json('data.stats.absences_mois'))->toBe(1)
        ->and($reponse->json('data.stats.retards_mois'))->toBe(2);
});

it('range l’emploi du temps par jour de la semaine puis par heure', function () {
    foreach ([['jeudi', '14:00'], ['Lundi', '10:00'], ['lundi', '08:00'], ['mardi', '08:00']] as [$jour, $debut]) {
        EmploiDuTemps::factory()->create([
            'ecole_id' => $this->ecole->id, 'classe_id' => $this->classe->id, 'jour' => $jour,
            'heure_debut' => $debut, 'heure_fin' => '18:00',
        ]);
    }

    $reponse = $this->actingAs($this->eleve->user)->getJson('/api/dashboard/eleve')->assertOk();

    $ordre = collect($reponse->json('data.emploi_du_temps'))->map(fn ($c) => strtolower($c['jour']).' '.substr($c['heure_debut'], 0, 5));
    expect($ordre->all())->toBe(['lundi 08:00', 'lundi 10:00', 'mardi 08:00', 'jeudi 14:00']);
});
