<?php

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\EnseignantMatiere;
use App\Models\EnseignantsMaternellePrimaire;
use App\Models\Matieres;
use App\Models\Message;
use App\Models\Series;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
 * Qui peut écrire à qui (audit BUG-010).
 *
 * La liste des contacts renvoyait tous les utilisateurs actifs de l'école :
 * un parent y voyait les élèves, les autres parents et les étudiants, avec
 * leur nom complet, et pouvait leur écrire. L'envoi lui-même n'était limité
 * qu'à « même école ».
 *
 * Règle décidée le 14/11 : un parent joint l'administration de l'école de ses
 * enfants et les enseignants de ses enfants — pas les autres enseignants.
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
    $this->comptable = $creer('comptable', 'Comptable');

    // Les enfants du parent : un au collège (6ème), un au primaire (CE1).
    $sixieme = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $ce1 = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $autreClasse = Classes::factory()->create(['ecole_id' => $this->ecole->id]);
    $famille = UserParent::factory()->create(['ecole_id' => $this->ecole->id, 'user_id' => $this->parent->id]);
    foreach ([$sixieme, $ce1] as $classe) {
        $famille->eleves()->attach(Eleve::factory()->forSchool($this->ecole)->create(['classe_id' => $classe->id])->id);
    }

    // L'enseignant de 6ème (affecté par matière), celui de CE1 (maître de la
    // classe), et un enseignant d'une autre classe.
    $matiere = Matieres::factory()->create(['ecole_id' => $this->ecole->id]);
    $serie = Series::factory()->create(['ecole_id' => $this->ecole->id]);
    $affecter = function (User $user, Classes $classe) use ($matiere, $serie) {
        $fiche = Enseignant::factory()->create(['ecole_id' => $this->ecole->id, 'user_id' => $user->id]);
        EnseignantMatiere::create(['enseignant_id' => $fiche->id, 'matiere_id' => $matiere->id, 'classe_id' => $classe->id, 'serie_id' => $serie->id, 'ecole_id' => $this->ecole->id]);
    };
    $affecter($this->enseignant, $sixieme);
    $this->maitre = $creer('enseignementP', 'Maitre');
    EnseignantsMaternellePrimaire::create(['user_id' => $this->maitre->id, 'classe_id' => $ce1->id, 'ecole_id' => $this->ecole->id]);
    $this->autreEnseignant = $creer('enseignant', 'AutreEnseignant');
    $affecter($this->autreEnseignant, $autreClasse);
});

function nomsDesContacts($test, User $utilisateur): array
{
    return collect($test->actingAs($utilisateur)->getJson('/api/messages/contacts')->assertOk()->json('data'))
        ->map(fn ($c) => $c['name'] ?? $c['nom'] ?? null)->filter()->sort()->values()->all();
}

function rolesDesContacts($test, User $utilisateur): array
{
    return collect($test->actingAs($utilisateur)->getJson('/api/messages/contacts')->assertOk()->json('data'))
        ->pluck('role')->unique()->sort()->values()->all();
}

it('montre à un parent l’administration et les enseignants de ses enfants, pas les autres', function () {
    expect(rolesDesContacts($this, $this->parent))->toBe(['comptable', 'directeur', 'enseignant', 'enseignementP', 'secretaire'])
        ->and(nomsDesContacts($this, $this->parent))->toContain('X Enseignant', 'X Maitre')
        ->and(nomsDesContacts($this, $this->parent))->not->toContain('X AutreEnseignant');
});

it('montre à un parent sans enfant inscrit la seule administration', function () {
    expect(rolesDesContacts($this, $this->autreParent))->toBe(['comptable', 'directeur', 'secretaire']);
});

it('refuse à un parent d’écrire à l’enseignant d’une autre classe, même en forgeant la requête', function () {
    $this->actingAs($this->parent)
        ->postJson('/api/messages', ['destinataire' => (string) $this->autreEnseignant->id, 'contenu' => 'Bonjour'])
        ->assertStatus(403);
});

it('ne montre à un élève que le personnel de l’école', function () {
    expect(rolesDesContacts($this, $this->eleve))->toBe(['comptable', 'directeur', 'enseignant', 'enseignementP', 'secretaire']);
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

it('laisse un parent écrire aux enseignants de ses enfants, collège et primaire', function (string $cible) {
    $this->actingAs($this->parent)
        ->postJson('/api/messages', ['destinataire' => (string) $this->{$cible}->id, 'contenu' => 'Bonjour'])
        ->assertCreated();
})->with(['enseignant', 'maitre', 'comptable']);

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
