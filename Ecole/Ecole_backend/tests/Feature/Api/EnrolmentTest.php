<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/*
 * Inscription d'un élève (audit BUG-002, lot 4.1).
 *
 * Le web n'avait aucun formulaire d'inscription. L'API en avait un, mais
 * réservé au directeur (la politique l'ouvre pourtant au secrétariat), qui
 * exigeait de l'agent un identifiant, un mot de passe et un matricule, et
 * répondait 500 dès que l'e-mail ou la série manquait. Rien ne rattachait le
 * parent : il fallait un second écran, qui n'existe pas non plus.
 */

function bureau(string $role = 'secretaire'): array
{
    $ecole = Ecole::factory()->create(['status' => 'active']);
    $agent = User::factory()->create(['role' => $role, 'ecole_id' => $ecole->id]);
    $classe = Classes::factory()->create(['ecole_id' => $ecole->id, 'nom_classe' => '6ème']);
    test()->actingAs($agent);

    return [$ecole, $classe];
}

function inscrire(Classes $classe, array $extra = [])
{
    return test()->postJson('/api/eleves/store', $extra + ['name' => 'DOSSOU', 'prenom' => 'Afi', 'classe_id' => $classe->id]);
}

it('laisse le secrétariat inscrire un élève avec un nom, un prénom et une classe', function () {
    [$ecole, $classe] = bureau();

    $reponse = inscrire($classe)->assertCreated();

    $eleve = Eleve::with('user')->sole();
    expect($eleve->classe_id)->toBe($classe->id)
        ->and($eleve->ecole_id)->toBe($ecole->id)
        ->and($eleve->numero_matricule)->not->toBeEmpty()
        ->and($eleve->user->role)->toBe('eleve')
        ->and($eleve->user->identifiant)->toBe($eleve->numero_matricule);

    expect($reponse->json('acces.eleve.identifiant'))->toBe($eleve->numero_matricule)
        ->and(Hash::check($reponse->json('acces.eleve.mot_de_passe_provisoire'), $eleve->user->password))->toBeTrue()
        ->and($reponse->json('acces.parent'))->toBeNull();
});

it('crée le compte du parent, le rattache, et le parent voit son enfant', function () {
    [, $classe] = bureau();

    $reponse = inscrire($classe, ['parent' => ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '01 97 00 00 01']])
        ->assertCreated();

    $parent = User::where('role', 'parent')->sole();
    expect($parent->telephone)->toBe('+2290197000001')
        ->and($parent->identifiant)->toBe('0197000001')
        ->and($reponse->json('acces.parent'))->toMatchArray(['identifiant' => '0197000001', 'nouveau' => true])
        ->and(Hash::check($reponse->json('acces.parent.mot_de_passe_provisoire'), $parent->password))->toBeTrue();

    $enfants = $this->actingAs($parent)->getJson('/api/parent/enfants')->assertOk()->json('data');
    expect($enfants)->toHaveCount(1)->and($enfants[0]['id'])->toBe(Eleve::sole()->id);
    // Premier parent du dossier : c'est lui le contact de référence.
    expect((bool) Eleve::sole()->parents()->first()->pivot->is_primary)->toBeTrue();
});

it('rattache un second enfant au parent déjà connu, même saisi à l’ancien format', function () {
    [, $classe] = bureau();
    inscrire($classe, ['parent' => ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '0197000001']])->assertCreated();

    $reponse = inscrire($classe, ['prenom' => 'Sena', 'parent' => ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '+229 97 00 00 01']])
        ->assertCreated();

    expect(User::where('role', 'parent')->count())->toBe(1)
        ->and($reponse->json('acces.parent'))->toMatchArray(['identifiant' => '0197000001', 'nouveau' => false])
        ->and($reponse->json('acces.parent.mot_de_passe_provisoire'))->toBeNull()
        ->and(User::where('role', 'parent')->sole()->parent->eleves()->count())->toBe(2);
});

it('refuse un téléphone de parent mal formé sans rien créer', function () {
    [, $classe] = bureau();

    inscrire($classe, ['parent' => ['name' => 'DOSSOU', 'prenom' => 'Koffi', 'telephone' => '12345']])
        ->assertStatus(422)->assertJsonValidationErrors('parent.telephone');

    expect(Eleve::count())->toBe(0);
});

it('garde le matricule fourni et refuse un doublon', function () {
    [, $classe] = bureau();

    inscrire($classe, ['numero_matricule' => 'BEN2026001'])->assertCreated();
    inscrire($classe, ['prenom' => 'Sena', 'numero_matricule' => 'BEN2026001'])
        ->assertStatus(422)->assertJsonValidationErrors('numero_matricule');

    expect(Eleve::sole()->numero_matricule)->toBe('BEN2026001');
});

it('ne laisse pas un enseignant inscrire', function () {
    [, $classe] = bureau('enseignant');

    inscrire($classe)->assertStatus(403);
});
