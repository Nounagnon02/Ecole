<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/*
 * Inscription en masse par CSV : élèves (avec leur parent), parents,
 * enseignants et personnel dans un seul fichier. Tout ou rien.
 */

const ENTETE = 'role;nom;prenom;telephone;email;classe;matricule;sexe;date_naissance;parent_nom;parent_prenom;parent_telephone';

function ecoleAvecClasses(string $role = 'directeur'): Ecole
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => 'CM2']);
    test()->actingAs(User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id]));

    return $ecole;
}

function importer(array $lignes, array $options = [], string $entete = ENTETE)
{
    $fichier = UploadedFile::fake()->createWithContent('comptes.csv', implode("\r\n", [$entete, ...$lignes]));

    return test()->post('/api/imports/comptes', ['file' => $fichier] + $options, ['Accept' => 'application/json']);
}

it('inscrit élèves, parents, enseignants et personnel d’un seul fichier', function () {
    $ecole = ecoleAvecClasses();

    $reponse = importer([
        'eleve;DOSSOU;Afi;;;6ème;BEN2026001;F;14/03/2014;DOSSOU;Koffi;01 97 00 00 01',
        'eleve;DOSSOU;Sena;;;CM2;;M;;DOSSOU;Koffi;97000001',
        'eleve;AGBO;Luc;;;6 EME;;;;;;',
        'enseignant;HOUNKPE;Marie;0196000002;marie@ecole.test;;;;;;;',
        'secretaire;ZINSOU;Paul;0196000003;;;;;;;;',
        'parent;KPADE;Rita;0196000004;;;BEN2026001;;;;;',
    ])->assertOk();

    expect($reponse->json('crees'))->toBe(['eleve' => 3, 'parent' => 2, 'enseignant' => 1, 'secretaire' => 1])
        ->and($reponse->json('total'))->toBe(6);

    // Les deux enfants DOSSOU partagent un seul compte parent.
    $koffi = User::where('identifiant', '0197000001')->sole();
    expect($koffi->parent->eleves()->count())->toBe(2)
        ->and(Eleve::where('numero_matricule', 'BEN2026001')->sole()->date_naissance?->format('Y-m-d') ?? (string) Eleve::where('numero_matricule', 'BEN2026001')->sole()->date_naissance)
        ->toContain('2014-03-14');

    // Le second parent de la première élève est rattaché, sans devenir le contact de référence.
    expect(Eleve::where('numero_matricule', 'BEN2026001')->sole()->parents()->count())->toBe(2);

    $marie = User::where('identifiant', '0196000002')->sole();
    expect($marie->role)->toBe('enseignant')
        ->and($marie->ecole_id)->toBe($ecole->id)
        ->and(Enseignant::where('user_id', $marie->id)->exists())->toBeTrue()
        ->and((bool) $marie->password_change_required)->toBeTrue();

    // Chaque compte créé sort une fois avec son mot de passe provisoire, qui fonctionne.
    $acces = collect($reponse->json('acces'));
    expect($acces)->toHaveCount(7)
        ->and(Hash::check($acces->firstWhere('identifiant', '0196000002')['mot_de_passe_provisoire'], $marie->password))->toBeTrue()
        ->and(Hash::check($acces->firstWhere('identifiant', 'BEN2026001')['mot_de_passe_provisoire'], User::where('identifiant', 'BEN2026001')->sole()->password))->toBeTrue();
});

it('ne crée rien si une seule ligne est refusée, et dit laquelle et pourquoi', function () {
    ecoleAvecClasses();

    $reponse = importer([
        'eleve;DOSSOU;Afi;;;6ème;;;;;;',
        'eleve;AGBO;Luc;;;7ème;;;;;;',
        'eleve;KPADE;Rita;;;CM2;;;;KPADE;Jean;12345',
        'sorcier;X;Y;0196000009;;;;;;;;',
    ])->assertOk()->assertJsonPath('success', false);

    expect(collect($reponse->json('erreurs'))->pluck('ligne')->all())->toBe([3, 4, 5])
        ->and($reponse->json('erreurs.0.message'))->toContain('Classe « 7ème » introuvable')
        ->and($reponse->json('erreurs.1.message'))->toContain('Téléphone du parent')
        ->and($reponse->json('erreurs.2.message'))->toContain('Rôle « sorcier » inconnu')
        ->and($reponse->json('acces'))->toBe([])
        ->and(Eleve::count())->toBe(0)
        ->and(User::where('role', 'eleve')->count())->toBe(0);
});

it('en simulation, contrôle tout mais ne garde rien et ne sort aucun mot de passe', function () {
    ecoleAvecClasses();

    $reponse = importer(['eleve;DOSSOU;Afi;;;6ème;;;;DOSSOU;Koffi;0197000001'], ['simulation' => '1'])->assertOk();

    expect($reponse->json('simulation'))->toBeTrue()
        ->and($reponse->json('crees'))->toBe(['eleve' => 1, 'parent' => 1])
        ->and($reponse->json('acces'))->toBe([])
        ->and(Eleve::count())->toBe(0)
        ->and(User::where('role', 'parent')->count())->toBe(0);
});

it('refuse les doublons, dans le fichier comme avec la base', function () {
    ecoleAvecClasses();
    importer(['eleve;DOSSOU;Afi;;;6ème;BEN1;;;;;;', 'enseignant;HOUNKPE;Marie;0196000002;;;;;;;;'])->assertOk();

    $reponse = importer([
        'eleve;AGBO;Luc;;;6ème;BEN1;;;;;;',
        'eleve;AGBO;Lea;;;6ème;BEN2;;;;;;',
        'eleve;AGBO;Leo;;;6ème;BEN2;;;;;;',
        'enseignant;HOUNKPE;Marie;+229 96 00 00 02;;;;;;;;',
        'comptable;A;B;0196000005;;;;;;;;',
        'comptable;C;D;96000005;;;;;;;;',
    ])->assertOk()->assertJsonPath('success', false);

    expect(collect($reponse->json('erreurs'))->pluck('ligne')->all())->toBe([2, 4, 5, 7])
        ->and($reponse->json('erreurs.2.message'))->toContain('Un compte existe déjà')
        ->and($reponse->json('erreurs.3.message'))->toContain('deux fois dans le fichier');
});

it('ne laisse pas le secrétariat créer des comptes du personnel', function () {
    ecoleAvecClasses('secretaire');

    importer(['eleve;DOSSOU;Afi;;;6ème;;;;;;'])->assertOk();
    importer(['comptable;A;B;0196000005;;;;;;;;'])
        ->assertOk()->assertJsonPath('success', false)->assertJsonPath('erreurs.0.message', 'Seule la direction peut créer un compte du personnel.');

    expect(User::where('role', 'comptable')->count())->toBe(0);
});

it('accepte un fichier de tableur : virgules, BOM, colonnes en désordre et accents dans les en-têtes', function () {
    ecoleAvecClasses();

    importer(['6ème,AGBO,Luc,Élève'], [], "\xEF\xBB\xBF".'Classe,Nom,Prénom,Rôle')->assertOk();

    expect(Eleve::with('user')->sole()->user->name)->toBe('AGBO');
});

it('refuse un fichier sans les colonnes attendues, trop long, ou d’un rôle non autorisé', function () {
    ecoleAvecClasses();

    importer(['DOSSOU;Afi'], [], 'nom;prenom')->assertOk()->assertJsonPath('success', false)->assertJsonPath('erreurs.0.ligne', 1);
    importer(array_fill(0, 201, 'eleve;DOSSOU;Afi;;;6ème;;;;;;'))
        ->assertOk()->assertJsonPath('success', false)->assertJsonFragment(['ligne' => 1]);
    expect(Eleve::count())->toBe(0);

    test()->actingAs(User::factory()->create(['role' => 'enseignant', 'ecole_id' => Ecole::first()->id]));
    importer(['eleve;DOSSOU;Afi;;;6ème;;;;;;'])->assertStatus(403);
});
