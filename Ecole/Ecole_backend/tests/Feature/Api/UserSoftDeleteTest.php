<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Enseignant;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Suppression douce des comptes.
 *
 * Supprimer un compte en dur provoquait des suppressions en cascade sur les
 * profils (`eleves`, `enseignants`, `parents`) et leurs historiques (notes,
 * paiements, notifications). Le soft delete (`users.deleted_at`) coupe
 * l'accès au compte sans effacer le dossier.
 */
class UserSoftDeleteTest extends TestCase
{
    use RefreshDatabase;

    private function creerEnseignant(Ecole $school): Enseignant
    {
        return Enseignant::factory()->forSchool($school)->create();
    }

    /** @test */
    public function director_deleting_a_teacher_soft_deletes_account_and_keeps_history()
    {
        $school = $this->actingInSchool();
        $enseignant = $this->creerEnseignant($school);
        $user = $enseignant->user;

        $user->createToken('mobile');
        Notification::create([
            'user_id'  => $user->id,
            'type'     => 'info',
            'titre'    => 'Bienvenue',
            'message'  => 'Compte créé',
            'lu'       => false,
            'ecole_id' => $school->id,
        ]);

        $this->deleteJson("/api/enseignants/delete/{$enseignant->id}")
            ->assertStatus(200);

        // Le compte est bien supprimé (soft)…
        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertNull(User::find($user->id));
        $this->assertNotNull(User::withTrashed()->find($user->id));

        // …mais son profil, ses notifications et son historique survivent.
        $this->assertDatabaseHas('enseignants', ['id' => $enseignant->id]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'titre'   => 'Bienvenue',
        ]);
        // Les tokens sont révoqués : plus aucun accès via l'ancien jeton.
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    /** @test */
    public function deleted_teachers_disappear_from_the_active_list()
    {
        $school = $this->actingInSchool();
        $reste = $this->creerEnseignant($school);
        $supprime = $this->creerEnseignant($school);

        $this->deleteJson("/api/enseignants/delete/{$supprime->id}")
            ->assertStatus(200);

        $this->getJson('/api/enseignants')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $reste->id)
            ->assertJsonPath('0.user.name', $reste->user->name);
    }

    /** @test */
    public function soft_deleted_user_cannot_log_in_anymore()
    {
        $school = Ecole::factory()->create();
        $user = User::factory()->create([
            'role'     => 'enseignant',
            'ecole_id' => $school->id,
            'email'    => 'ancien.prof@example.com',
            'password' => 'secret123',
        ]);

        $user->delete();

        $this->postJson('/api/auth/login', [
            'email'    => 'ancien.prof@example.com',
            'password' => 'secret123',
        ])->assertStatus(401);
    }

    /** @test */
    public function deleting_a_parent_keeps_the_links_to_their_children()
    {
        $school = $this->actingInSchool();
        $parent = UserParent::factory()->forSchool($school)->create();
        $user = $parent->user;

        $this->deleteJson("/api/parents/{$parent->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertDatabaseHas('parents', ['id' => $parent->id]);
    }

    /** @test */
    public function super_admin_deleting_an_account_revokes_its_tokens()
    {
        // Hôte hors de la liste `sanctum.stateful` (localhost) : le guard ne
        // retombe pas sur la session web, seuls les tokens bearer comptent.
        $this->withHeaders(['Host' => 'api.example.com']);

        $school = Ecole::factory()->create();
        $admin = User::factory()->create([
            'role'     => 'super-admin',
            'ecole_id' => $school->id,
        ]);
        $cible = User::factory()->create([
            'role'     => 'comptable',
            'ecole_id' => $school->id,
        ]);

        $adminToken = $admin->createToken('admin')->plainTextToken;
        $cibleToken = $cible->createToken('mobile')->plainTextToken;

        $this->withToken($adminToken)
            ->deleteJson("/api/admin/utilisateurs/{$cible->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('users', ['id' => $cible->id]);

        // Le guard Sanctum est un singleton : il garde en mémoire le token de
        // la requête précédente. On repart d'un état vierge avant de prouver
        // que l'ancien jeton du compte supprimé ne donne plus accès.
        auth()->forgetGuards();
        $this->withToken($cibleToken)
            ->getJson('/api/comptable/paiements')
            ->assertStatus(401);

        // …tandis que celui de l'administrateur reste valide.
        $this->withToken($adminToken)
            ->getJson('/api/admin/utilisateurs')
            ->assertStatus(200);
    }
}
