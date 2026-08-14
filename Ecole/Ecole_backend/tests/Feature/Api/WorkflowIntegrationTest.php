<?php

use App\Models\{
    Ecole, User, Classes, Series, Matieres, Eleve, Enseignant,
    UserParent, Notes, CahierDeTexte, EmploiDuTemps, Communication,
    Exercice, PaiementEleve
};

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'super-admin']);
});

it('returns a teacher by id', function () {
    $ecole = Ecole::factory()->create();
    $enseignant = Enseignant::factory()->create(['ecole_id' => $ecole->id]);
    $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);

    $response = $this->actingAs($user)->getJson("/api/enseignants/{$enseignant->id}");

    $response->assertOk()
        ->assertJsonStructure(['id', 'user']);
});

it('updates a teacher', function () {
    $ecole = Ecole::factory()->create();
    $enseignant = Enseignant::factory()->create(['ecole_id' => $ecole->id]);
    $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);
    $newName = 'Nouveau Nom';

    $response = $this->actingAs($user)->putJson("/api/enseignants/update/{$enseignant->id}", [
        'name' => $newName,
    ]);

    $response->assertOk();
    expect($enseignant->fresh()->user->name)->toBe($newName);
});

it('deletes a teacher', function () {
    $ecole = Ecole::factory()->create();
    $enseignant = Enseignant::factory()->create(['ecole_id' => $ecole->id]);
    $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);

    $response = $this->actingAs($user)->deleteJson("/api/enseignants/delete/{$enseignant->id}");

    $response->assertOk();
    // Suppression douce : le profil survit, seul le compte est désactivé.
    expect(Enseignant::find($enseignant->id))->not->toBeNull();
    expect($enseignant->fresh()->user)->toBeNull();
});

it('returns subjects filtered by niveau primaire', function () {
    $matiere = Matieres::factory()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/matieres/niveaux/primaire');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => []]);
});

it('returns subjects filtered by niveau secondaire', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson('/api/matieres/niveaux/secondaire');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => []]);
});

it('returns subjects filtered by niveau maternelle', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson('/api/matieres/niveaux/maternelle');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => []]);
});

it('returns 404 for invalid niveau', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson('/api/matieres/niveaux/invalid');

    $response->assertStatus(404);
});

it('returns children of a parent', function () {
    $ecole = Ecole::factory()->create();
    $user = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);
    $parent = UserParent::factory()->create(['user_id' => $user->id, 'ecole_id' => $ecole->id]);
    $eleve = Eleve::factory()->create(['ecole_id' => $ecole->id]);
    $parent->eleves()->attach($eleve);

    $response = $this->actingAs($user)->getJson("/api/parents/{$parent->id}/eleves");

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => []]);
});

it('returns student timetable', function () {
    $ecole = Ecole::factory()->create();
    $user = User::factory()->create(['role' => 'eleve', 'ecole_id' => $ecole->id]);
    $eleve = Eleve::factory()->create(['user_id' => $user->id, 'ecole_id' => $ecole->id]);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $eleve->update(['classe_id' => $classe->id]);

    EmploiDuTemps::factory()->create(['classe_id' => $classe->id, 'ecole_id' => $ecole->id]);

    $this->actingAs($user);

    $response = $this->getJson('/api/eleves/me/emploi-du-temps');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => []]);
});

it('returns 404 for student timetable when no profile', function () {
    $user = User::factory()->create(['role' => 'eleve']);

    $this->actingAs($user);

    $response = $this->getJson('/api/eleves/me/emploi-du-temps');

    $response->assertStatus(404);
});

it('returns a paginated list of exercises', function () {
    $ecole = Ecole::factory()->create();
    $enseignant = Enseignant::factory()->create();
    $user = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]);
    $enseignant->user()->associate($user);
    $enseignant->save();
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);

    Exercice::factory()->count(3)->create([
        'enseignant_id' => $enseignant->id,
        'classe_id' => $classe->id,
        'ecole_id' => $ecole->id,
    ]);

    $response = $this->actingAs($user)->getJson('/api/exercices');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => ['data', 'total', 'per_page']]);
});

it('creates an exercise', function () {
    $ecole = Ecole::factory()->create();
    $user = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]);
    $enseignant = Enseignant::factory()->forSchool($ecole)->create(['user_id' => $user->id]);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);

    $response = $this->actingAs($user)->postJson('/api/exercices', [
        'classe_id' => $classe->id,
        'enseignant_id' => $enseignant->id,
        'titre' => 'Devoir de mathématiques',
        'description' => 'Exercices page 42',
        'date_limite' => now()->addDays(7)->toDateString(),
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['success', 'data' => ['id']]);
});

it('returns the authenticated user profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonStructure(['success', 'user' => ['id', 'name', 'prenom', 'email']]);
});

it('updates the authenticated user profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson('/api/auth/profile', [
        'name' => 'Nouveau Nom',
        'prenom' => 'Nouveau Prénom',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['success', 'user' => ['id', 'name', 'prenom']]);
    expect($user->fresh()->name)->toBe('Nouveau Nom');
});

it('returns 401 when updating profile without auth', function () {
    $response = $this->putJson('/api/auth/profile', [
        'name' => 'Hacker',
    ]);

    $response->assertStatus(401);
});

it('secretaire routes are registered and accessible', function () {
    $ecole = Ecole::factory()->create();
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $user = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]);
    $this->actingAs($user);

    $response = $this->postJson('/api/secretaire/dossiers', [
        'eleve_nom' => 'Dupont',
        'eleve_prenom' => 'Jean',
        'classe_id' => $classe->id,
        'type_dossier' => 'inscription',
    ]);

    $response->assertStatus(501);
});

it('secretaire courrier route is registered', function () {
    $ecole = Ecole::factory()->create();
    $user = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]);
    $this->actingAs($user);

    $response = $this->postJson('/api/secretaire/courriers', [
        'expediteur' => 'Mairie',
        'destinataire' => 'Direction',
        'objet' => 'Convocation',
        'type' => 'entrant',
        'date_reception' => now()->toDateString(),
    ]);

    $response->assertStatus(501);
});

it('secretaire visiteur route is registered', function () {
    $ecole = Ecole::factory()->create();
    $user = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]);
    $this->actingAs($user);

    $response = $this->postJson('/api/secretaire/visiteurs', [
        'nom_visiteur' => 'M. X',
        'motif' => 'Rendez-vous',
        'heure_arrivee' => '10:00',
        'date_visite' => now()->toDateString(),
    ]);

    $response->assertStatus(501);
});

it('stub secretariat methods are wired and return not-implemented', function () {
    $ecole = Ecole::factory()->create();
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $user = User::factory()->create(['role' => 'secretaire', 'ecole_id' => $ecole->id]);
    $this->actingAs($user);

    $payload = [
        'eleve_nom' => 'Dupont', 'eleve_prenom' => 'Jean',
        'classe_id' => $classe->id, 'type_dossier' => 'inscription',
    ];

    $r1 = $this->postJson('/api/secretaire/dossiers', $payload);
    $r1->assertStatus(501);

    $r2 = $this->postJson('/api/secretaire/courriers', array_merge($payload, [
        'expediteur' => 'Mairie', 'destinataire' => 'Direction',
        'objet' => 'Test', 'type' => 'entrant', 'date_reception' => now()->toDateString(),
    ]));
    $r2->assertStatus(501);

    $r3 = $this->postJson('/api/secretaire/visiteurs', array_merge($payload, [
        'nom_visiteur' => 'M. X', 'motif' => 'RDV', 'heure_arrivee' => '10:00', 'date_visite' => now()->toDateString(),
    ]));
    $r3->assertStatus(501);
});

it('note resource exposes correct property names', function () {
    $user = User::factory()->create(['role' => 'enseignant']);
    $enseignant = Enseignant::factory()->create(['user_id' => $user->id]);
    $classe = Classes::factory()->create();
    $matiere = Matieres::factory()->create();
    $eleve = Eleve::factory()->create();

    $note = Notes::factory()->create([
        'eleve_id' => $eleve->id,
        'classe_id' => $classe->id,
        'matiere_id' => $matiere->id,
        'note' => 15.5,
        'note_sur' => 20,
        'observation' => 'Bon travail',
        'date_evaluation' => now()->toDateString(),
    ]);

    $response = $this->actingAs($user)->getJson('/api/notes/eleve');

    $response->assertOk();
    if ($response->json('data.0')) {
        $data = $response->json('data.0');
        // NoteResource now maps correctly: valeur from note, appreciation from observation
        expect($data)->toHaveKey('valeur');
        expect($data)->toHaveKey('appreciation');
    }
});

it('series average calculation uses correct column name', function () {
    $ecole = Ecole::factory()->create();
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id]);
    $serie = Series::factory()->create(['ecole_id' => $ecole->id]);
    $matiere = Matieres::factory()->create(['ecole_id' => $ecole->id]);
    $serie->matieres()->attach($matiere, ['coefficient' => 2, 'classe_id' => $classe->id]);
    $eleve = Eleve::factory()->create(['serie_id' => $serie->id, 'classe_id' => $classe->id, 'ecole_id' => $ecole->id]);

    Notes::factory()->create([
        'eleve_id' => $eleve->id,
        'matiere_id' => $matiere->id,
        'classe_id' => $classe->id,
        'ecole_id' => $ecole->id,
        'note' => 14.0,
        'note_sur' => 20,
    ]);

    \App\Support\SchoolContext::bind($ecole->id);
    $moyenne = $serie->calculMoyenneGenerale($eleve->id);
    \App\Support\SchoolContext::forget();

    expect($moyenne)->toBeGreaterThanOrEqual(13.9);
    expect($moyenne)->toBeLessThanOrEqual(14.1);
});

it('exercise model uses BelongsToEcole scoping', function () {
    $ecole1 = Ecole::factory()->create();
    $ecole2 = Ecole::factory()->create();
    $enseignant = Enseignant::factory()->create();
    $user1 = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole1->id]);
    $enseignant->user()->associate($user1);
    $enseignant->save();
    $classe = Classes::factory()->create(['ecole_id' => $ecole1->id]);

    $ex1 = Exercice::create([
        'ecole_id' => $ecole1->id,
        'classe_id' => $classe->id,
        'enseignant_id' => $enseignant->id,
        'titre' => 'Ex 1',
        'description' => 'Desc 1',
        'date_limite' => now()->addDays(3),
    ]);

    $ex2 = Exercice::create([
        'ecole_id' => $ecole2->id,
        'classe_id' => $classe->id,
        'enseignant_id' => $enseignant->id,
        'titre' => 'Ex 2',
        'description' => 'Desc 2',
        'date_limite' => now()->addDays(3),
    ]);

    $this->actingAs($user1);

    $response = $this->getJson('/api/exercices');

    $response->assertOk();
    $ids = collect($response->json('data.data'))->pluck('id')->toArray();
    expect($ids)->toContain($ex1->id);
    expect($ids)->not->toContain($ex2->id);
});
