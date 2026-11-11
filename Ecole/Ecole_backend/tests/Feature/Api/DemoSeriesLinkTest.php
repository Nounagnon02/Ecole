<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Matieres;
use App\Models\User;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/*
 * Audit BUG-009 : dans le jeu de démonstration, aucune classe n'avait de
 * série, donc la page des affectations ne proposait ni série ni matière et
 * aucun enseignant ne pouvait être affecté.
 */

it('range chaque classe dans la série de son cycle', function (string $classe, string $serie) {
    expect(DemoDataSeeder::serieNameForClass($classe))->toBe($serie);
})->with([
    ['Petite Section', 'Maternelle'], ['CM2', 'Primaire'], ['6ème', 'Collège'], ['3ème', 'Collège'],
    ['2nde C', 'Série C'], ['1ère D', 'Série D'], ['Tle A', 'Série A'], ['Tle A2', 'Série A'],
]);

it('donne à chaque classe sa série et ses matières, sans doublon si on rejoue', function () {
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $this->actingAs(User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]));

    foreach (['Collège', 'Série C'] as $nom) {
        DB::table('series')->insert(['ecole_id' => $ecole->id, 'nom' => $nom, 'created_at' => now(), 'updated_at' => now()]);
    }
    // Une série d'une autre école, de même nom, ne doit pas être prise.
    DB::table('series')->insert(['ecole_id' => Ecole::factory()->create()->id, 'nom' => 'Collège']);
    $sixieme = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    $seconde = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '2nde C']);
    $maths = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'Mathématiques']);
    $svt = Matieres::factory()->create(['ecole_id' => $ecole->id, 'nom' => 'SVT']);

    foreach ([[$sixieme, $maths, 3], [$sixieme, $svt, 2], [$seconde, $maths, 5]] as [$classe, $matiere, $coefficient]) {
        DB::table('classe_matieres')->insert([
            'ecole_id' => $ecole->id, 'classe_id' => $classe->id, 'matiere_id' => $matiere->id, 'coefficient' => $coefficient,
        ]);
    }

    expect(DemoDataSeeder::linkSeries($ecole->id))->toBe(3)
        ->and(DemoDataSeeder::linkSeries($ecole->id))->toBe(0);

    $classes = collect($this->getJson('/api/classes?with_matieres=1')->assertOk()->json())->keyBy('nom_classe');

    expect(collect($classes['6ème']['series'])->pluck('nom')->unique()->values()->all())->toBe(['Collège'])
        ->and(collect($classes['6ème']['series'][0]['matieres'])->pluck('nom')->sort()->values()->all())->toBe(['Mathématiques', 'SVT'])
        ->and(collect($classes['2nde C']['series'])->pluck('nom')->unique()->values()->all())->toBe(['Série C']);
});
