<?php

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Series;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/*
 * Relations inverses ajoutées lors de l'audit des liaisons.
 *
 * Chaque table enfant déclare un belongsTo vers sa parente ; ces tests
 * verrouillent que la parente déclare bien le hasMany en retour, avec la
 * bonne signature (une relation qui ne sait pas résoudre sa clé étrangère
 * serait un faux retour vide, pas une erreur visible).
 */

test('eleve exposes every child record as hasMany', function () {
    $eleve = new Eleve;

    foreach ([
        'bourses', 'certificats', 'sanctions', 'vaccinations',
        'consultationsMedicales', 'dossiersMedicaux', 'abonnementsTransport',
        'emprunts', 'reservations', 'rendezVous',
    ] as $relation) {
        expect($eleve->{$relation}())->toBeInstanceOf(HasMany::class);
    }
});

test('eleve matieres resolves through the eleves_matieres pivot', function () {
    $eleve = new Eleve;

    expect($eleve->matieres())->toBeInstanceOf(BelongsToMany::class)
        ->and($eleve->matieres()->getTable())->toBe('eleves_matieres')
        ->and($eleve->matieres()->getForeignPivotKeyName())->toBe('eleves_id')
        ->and($eleve->matieres()->getRelatedPivotKeyName())->toBe('matieres_id');
});

test('enseignant exposes its teaching activities as hasMany', function () {
    $enseignant = new Enseignant;

    foreach (['exercices', 'cahierDeTextes', 'emploisDuTemps', 'rendezVous'] as $relation) {
        expect($enseignant->{$relation}())->toBeInstanceOf(HasMany::class);
    }
});

test('classe exposes its school-life records as hasMany', function () {
    $classe = new Classes;

    foreach ([
        'notes', 'emploisDuTemps', 'devoirs', 'moyennes', 'cahierDeTextes',
        'exercices', 'bulletins', 'conseilsClasse',
    ] as $relation) {
        expect($classe->{$relation}())->toBeInstanceOf(HasMany::class);
    }

    // Le pivot des affectations porte `classe_id` : la relation doit viser
    // exactement cette colonne.
    expect($classe->enseignantMatieres())->toBeInstanceOf(HasMany::class)
        ->and($classe->enseignantMatieres()->getForeignKeyName())->toBe('classe_id');
});

test('serie exposes its contributions as hasMany on id_serie', function () {
    $serie = new Series;

    expect($serie->contributions())->toBeInstanceOf(HasMany::class)
        ->and($serie->contributions()->getForeignKeyName())->toBe('id_serie');
});

test('user exposes the maternelle-primaire profile as hasOne', function () {
    $user = new User;

    expect($user->enseignantMP())->toBeInstanceOf(HasOne::class)
        ->and($user->enseignantMP()->getForeignKeyName())->toBe('user_id');
});
