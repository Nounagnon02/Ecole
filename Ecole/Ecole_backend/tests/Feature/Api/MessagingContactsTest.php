<?php

use App\Models\Ecole;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Qui peut écrire à qui (audit BUG-010).
 *
 * La liste des contacts renvoyait tous les utilisateurs actifs de l'école :
 * un parent y voyait les élèves, les autres parents et les étudiants, avec
 * leur nom complet, et pouvait leur écrire. L'envoi lui-même n'était limité
 * qu'à « même école ».
 */

beforeEach(function () {
    $this->ecole = Ecole::factory()->create(['status' => 'active']);
    $creer = fn (string $role, string $nom) => User::factory()->create([
        'role' => $role, 'ecole_id' => $this->ecole->id, 'is_active' => true, 'name' => $nom, 'prenom' => 'X',
    ]);
    $this->parent = $creer('parent', 'Parent');
    $this->autreParent = $creer('parent', 'AutreParent');
    $this->eleve = $creer('eleve', 'Eleve');
    $this->autreEleve = $creer('eleve', 'AutreEleve');
    $this->enseignant = $creer('enseignant', 'Enseignant');
    $this->directeur = $creer('directeur', 'Directeur');
    $this->secretaire = $creer('secretaire', 'Secretaire');
    $this->etudiant = $creer('etudiant', 'Etudiant');
    $this->professeur = $creer('professeur', 'Professeur');
});

function rolesDesContacts($test, User $utilisateur): array
{
    return collect($test->actingAs($utilisateur)->getJson('/api/messages/contacts')->assertOk()->json('data'))
        ->pluck('role')->unique()->sort()->values()->all();
}

it('ne montre à un parent que le personnel de l’école', function () {
    expect(rolesDesContacts($this, $this->parent))->toBe(['directeur', 'enseignant', 'secretaire']);
});

it('ne montre à un élève que le personnel de l’école', function () {
    expect(rolesDesContacts($this, $this->eleve))->toBe(['directeur', 'enseignant', 'secretaire']);
});

it('ne montre à un étudiant que le personnel de l’université', function () {
    expect(rolesDesContacts($this, $this->etudiant))->toBe(['professeur']);
});

it('laisse le personnel joindre parents et élèves', function () {
    expect(rolesDesContacts($this, $this->enseignant))->toContain('parent', 'eleve', 'directeur');
});

it('refuse à un parent d’écrire à un élève ou à un autre parent, même en forgeant la requête', function (string $cible) {
    $this->actingAs($this->parent)
        ->postJson('/api/messages', ['destinataire' => (string) $this->{$cible}->id, 'contenu' => 'Bonjour'])
        ->assertStatus(403);

    expect(Message::count())->toBe(0);
})->with(['autreEleve', 'autreParent', 'etudiant']);

it('laisse un parent écrire à un enseignant', function () {
    $this->actingAs($this->parent)
        ->postJson('/api/messages', ['destinataire' => (string) $this->enseignant->id, 'contenu' => 'Bonjour'])
        ->assertCreated();
});

it('laisse répondre à quelqu’un qui vous a écrit, même hors de vos contacts', function () {
    // L'administrateur n'est pas un contact proposé aux familles, mais s'il
    // écrit à un parent, celui-ci doit pouvoir lui répondre.
    $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $this->ecole->id, 'is_active' => true]);
    Message::create([
        'ecole_id' => $this->ecole->id, 'expediteur' => (string) $admin->id, 'destinataire' => (string) $this->parent->id,
        'sujet' => 'Info', 'contenu' => 'Votre dossier est complet.', 'lu' => false,
    ]);

    $this->actingAs($this->parent)
        ->postJson('/api/messages', ['destinataire' => (string) $admin->id, 'contenu' => 'Merci'])
        ->assertCreated();
});
