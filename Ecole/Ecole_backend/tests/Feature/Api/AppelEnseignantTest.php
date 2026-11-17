<?php

use App\Models\Absence;
use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/*
 * Décision du 16/11/2026 (parcours 3 de la mission) : l'enseignant fait
 * l'appel de SES classes depuis le mobile. Mêmes règles que l'appel de la vie
 * scolaire (rejouable, une absence par élève et par jour), bornées à ses classes.
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $this->classe = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->autreClasse = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $this->eleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->classe->id]);
    $this->autreEleve = Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $this->autreClasse->id]);

    $this->prof = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->ecole->id]);
    $fiche = Enseignant::create(['user_id' => $this->prof->id, 'ecole_id' => $this->ecole->id]);
    $matiere = DB::table('matieres')->insertGetId(['ecole_id' => $this->ecole->id, 'nom' => 'Maths', 'created_at' => now(), 'updated_at' => now()]);
    $serie = DB::table('series')->insertGetId(['ecole_id' => $this->ecole->id, 'nom' => 'Collège', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('enseignant_matiere')->insert(['ecole_id' => $this->ecole->id, 'enseignant_id' => $fiche->id, 'matiere_id' => $matiere, 'classe_id' => $this->classe->id, 'serie_id' => $serie]);
});

it('ouvre la feuille d’appel d’une classe de l’enseignant', function () {
    $this->actingAs($this->prof)->getJson("/api/enseignant/appel/{$this->classe->id}")
        ->assertOk()->assertJsonPath('data.eleves.0.id', $this->eleve->id);
});

it('refuse la feuille d’appel d’une classe qui n’est pas la sienne', function () {
    $this->actingAs($this->prof)->getJson("/api/enseignant/appel/{$this->autreClasse->id}")->assertStatus(403);
});

it('enregistre l’appel de sa classe, rejouable sans doublon', function () {
    $corps = ['classe_id' => $this->classe->id, 'date' => now()->toDateString(), 'eleves' => [['eleve_id' => $this->eleve->id, 'statut' => 'absent']]];
    $this->actingAs($this->prof)->postJson('/api/enseignant/appel', $corps)->assertOk();
    $this->actingAs($this->prof)->postJson('/api/enseignant/appel', $corps)->assertOk();

    expect(Absence::where('eleve_id', $this->eleve->id)->count())->toBe(1);
});

it('refuse d’enregistrer l’appel d’une autre classe, même en forgeant la requête', function () {
    $this->actingAs($this->prof)->postJson('/api/enseignant/appel', [
        'classe_id' => $this->autreClasse->id, 'date' => now()->toDateString(),
        'eleves' => [['eleve_id' => $this->autreEleve->id, 'statut' => 'absent']],
    ])->assertStatus(403);

    expect(Absence::count())->toBe(0);
});
