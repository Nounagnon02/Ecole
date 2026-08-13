<?php

use App\Models\{
    Ecole, User, Enseignant, Matieres, EnseignantExperience,
    EnseignantMatiereMaitrisee
};

beforeEach(function () {
    $this->ecole = Ecole::factory()->create();
});

it('returns avatar and teacher profile fields in getProfile', function () {
    $user = User::factory()->create([
        'role' => 'enseignant',
        'ecole_id' => $this->ecole->id,
        'avatar' => 'avatars/photo.jpg',
    ]);
    $enseignant = Enseignant::factory()->create([
        'user_id' => $user->id,
        'ecole_id' => $this->ecole->id,
    ]);
    $matiere = Matieres::factory()->create(['ecole_id' => $this->ecole->id]);
    $enseignant->matieresMaitrisees()->attach($matiere->id, ['ecole_id' => $this->ecole->id]);
    $enseignant->experiences()->create([
        'ecole_id' => $this->ecole->id,
        'poste' => 'Professeur de mathématiques',
        'etablissement' => 'Lycée Alpha',
        'date_debut' => '2020-09-01',
        'date_fin' => null,
    ]);

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonPath('user.avatar', 'avatars/photo.jpg')
        ->assertJsonPath('user.profil.specialite', $enseignant->specialite)
        ->assertJsonPath('user.profil.experiences.0.poste', 'Professeur de mathématiques')
        ->assertJsonPath('user.profil.matieres_maitrisees.0.id', $matiere->id)
        ->assertJsonPath('user.profil.matieres_maitrisees.0.nom', $matiere->nom);
});

it('does not expose teacher profile for non-teacher roles', function () {
    $user = User::factory()->create([
        'role' => 'directeur',
        'ecole_id' => $this->ecole->id,
    ]);

    $response = $this->actingAs($user)->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonMissingPath('user.profil');
});

it('updates avatar and personal fields', function () {
    $user = User::factory()->create([
        'role' => 'enseignant',
        'ecole_id' => $this->ecole->id,
    ]);
    Enseignant::factory()->create(['user_id' => $user->id, 'ecole_id' => $this->ecole->id]);

    $response = $this->actingAs($user)->putJson('/api/auth/profile', [
        'name' => 'Kouassi',
        'prenom' => 'Jean',
        'avatar' => 'avatars/nouvelle.jpg',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.name', 'Kouassi')
        ->assertJsonPath('user.avatar', 'avatars/nouvelle.jpg');
    expect($user->fresh()->avatar)->toBe('avatars/nouvelle.jpg');
});

it('replaces experiences wholesale and syncs mastered subjects', function () {
    $user = User::factory()->create([
        'role' => 'enseignant',
        'ecole_id' => $this->ecole->id,
    ]);
    $enseignant = Enseignant::factory()->create([
        'user_id' => $user->id,
        'ecole_id' => $this->ecole->id,
    ]);

    $matiereA = Matieres::factory()->create(['ecole_id' => $this->ecole->id]);
    $matiereB = Matieres::factory()->create(['ecole_id' => $this->ecole->id]);

    $response = $this->actingAs($user)->putJson('/api/auth/profile', [
        'experiences' => [
            [
                'poste' => 'Maître auxiliaire',
                'etablissement' => 'Collège Bêta',
                'date_debut' => '2018-10-01',
                'date_fin' => '2020-06-30',
            ],
        ],
        'matieres_maitrisees' => [$matiereA->id, $matiereB->id],
    ]);

    $response->assertOk()
        ->assertJsonPath('user.profil.experiences.0.poste', 'Maître auxiliaire')
        ->assertJsonCount(2, 'user.profil.matieres_maitrisees');

    expect(EnseignantExperience::where('enseignant_id', $enseignant->id)->count())->toBe(1)
        ->and(EnseignantMatiereMaitrisee::where('enseignant_id', $enseignant->id)->count())->toBe(2);

    // Second appel sans expérience : l'existante est retirée, matières remplacées.
    $this->actingAs($user)->putJson('/api/auth/profile', [
        'experiences' => [],
        'matieres_maitrisees' => [$matiereB->id],
    ])->assertOk();

    expect(EnseignantExperience::where('enseignant_id', $enseignant->id)->count())->toBe(0)
        ->and(EnseignantMatiereMaitrisee::where('enseignant_id', $enseignant->id)->count())->toBe(1);
});

it('validates experience rows', function () {
    $user = User::factory()->create([
        'role' => 'enseignant',
        'ecole_id' => $this->ecole->id,
    ]);
    Enseignant::factory()->create(['user_id' => $user->id, 'ecole_id' => $this->ecole->id]);

    $response = $this->actingAs($user)->putJson('/api/auth/profile', [
        'experiences' => [
            ['etablissement' => 'Sans poste ni date'],
        ],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['experiences.0.poste', 'experiences.0.date_debut']);
});
