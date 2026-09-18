<?php

namespace Tests\Feature\Api;

use App\Mail\ParentInvitationMail;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\ParentEleve;
use App\Models\ParentInvitation;
use App\Models\User;
use App\Models\UserParent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * ParentsController — aucun test ne couvrait ce contrôleur avant celui-ci
 * (création de compte, invitation par email, acceptation d'invitation).
 */
class ParentsControllerTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $directeur;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
    }

    /** @test */
    public function a_director_can_create_a_parent_linked_to_a_student()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create();

        $response = $this->actingAs($this->directeur)->postJson('/api/parents', [
            'name' => 'Adjovi',
            'prenom' => 'Rose',
            'email' => 'rose.adjovi@ecole.bj',
            'identifiant' => 'ROSE-001',
            'password' => 'motdepasse123',
            'ecole_id' => $this->school->id,
            'eleve_ids' => [$eleve->id],
        ])->assertStatus(201);

        $this->assertDatabaseHas('users', ['identifiant' => 'ROSE-001', 'role' => 'parent']);
        $this->assertCount(1, $response->json('eleves'));
    }

    /** @test */
    public function creating_a_parent_rejects_a_student_from_another_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreignEleve = $this->withoutTenantScope($otherSchool, fn () => Eleve::factory()->forSchool($otherSchool)->create());

        $this->actingAs($this->directeur)->postJson('/api/parents', [
            'name' => 'Z', 'prenom' => 'Z', 'email' => 'z@ecole.bj',
            'identifiant' => 'Z-001', 'password' => 'motdepasse123', 'ecole_id' => $this->school->id,
            'eleve_ids' => [$foreignEleve->id],
        ])->assertStatus(422)->assertJsonValidationErrors(['eleve_ids.0']);
    }

    /** @test */
    public function a_teacher_cannot_create_a_parent()
    {
        $teacher = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $this->school->id]);

        $this->actingAs($teacher)->postJson('/api/parents', [
            'name' => 'X', 'prenom' => 'Y', 'email' => 'xy@ecole.bj',
            'identifiant' => 'XY-001', 'password' => 'motdepasse123', 'ecole_id' => $this->school->id,
        ])->assertForbidden();
    }

    /** @test */
    public function a_director_can_invite_a_parent_by_email()
    {
        Mail::fake();
        $eleve = Eleve::factory()->forSchool($this->school)->create();

        $response = $this->actingAs($this->directeur)->postJson('/api/parents/invite', [
            'email' => 'papa@ecole.bj',
            'eleve_id' => $eleve->id,
            'is_primary' => true,
        ])->assertStatus(201);

        $this->assertTrue($response->json('success'));
        $this->assertDatabaseHas('parent_invitations', ['email' => 'papa@ecole.bj', 'eleve_id' => $eleve->id]);
        Mail::assertQueued(ParentInvitationMail::class);
    }

    /** @test */
    public function inviting_the_same_email_twice_for_the_same_student_is_refused()
    {
        Mail::fake();
        $eleve = Eleve::factory()->forSchool($this->school)->create();

        $this->actingAs($this->directeur)->postJson('/api/parents/invite', [
            'email' => 'papa@ecole.bj',
            'eleve_id' => $eleve->id,
        ])->assertStatus(201);

        $this->actingAs($this->directeur)->postJson('/api/parents/invite', [
            'email' => 'papa@ecole.bj',
            'eleve_id' => $eleve->id,
        ])->assertStatus(422);
    }

    /** @test */
    public function a_valid_invitation_token_can_be_verified_publicly()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create();
        $invitation = ParentInvitation::create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'created_by' => $this->directeur->id,
            'email' => 'papa@ecole.bj',
            'token' => ParentInvitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->getJson('/api/public/parent/invitation/' . $invitation->token . '/verify')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'papa@ecole.bj');
    }

    /** @test */
    public function accepting_an_invitation_creates_the_account_and_the_link()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create();
        $invitation = ParentInvitation::create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'created_by' => $this->directeur->id,
            'email' => 'maman@ecole.bj',
            'token' => ParentInvitation::generateToken(),
            'is_primary' => true,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->postJson('/api/public/parent/accept-invitation', [
            'token' => $invitation->token,
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
            'name' => 'Dossou',
            'prenom' => 'Alice',
        ])->assertStatus(201);

        $this->assertTrue($response->json('success'));
        $this->assertDatabaseHas('users', ['email' => 'maman@ecole.bj', 'role' => 'parent']);
        $this->assertDatabaseHas('parent_invitations', ['id' => $invitation->id, 'is_accepted' => true]);

        $userId = User::where('email', 'maman@ecole.bj')->value('id');
        $this->assertDatabaseHas('parents', ['user_id' => $userId, 'ecole_id' => $this->school->id]);
        $this->assertDatabaseHas('eleves_parents', ['eleve_id' => $eleve->id, 'ecole_id' => $this->school->id]);
    }

    /** @test */
    public function accepting_an_expired_invitation_is_refused()
    {
        $eleve = Eleve::factory()->forSchool($this->school)->create();
        $invitation = ParentInvitation::create([
            'ecole_id' => $this->school->id,
            'eleve_id' => $eleve->id,
            'created_by' => $this->directeur->id,
            'email' => 'expire@ecole.bj',
            'token' => ParentInvitation::generateToken(),
            'expires_at' => now()->subDay(),
        ]);

        $this->postJson('/api/public/parent/accept-invitation', [
            'token' => $invitation->token,
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
            'name' => 'X',
            'prenom' => 'Y',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'expire@ecole.bj']);
    }

    /** @test */
    public function a_director_can_update_and_relink_a_parent()
    {
        $this->actingAs($this->directeur);

        $eleve1 = Eleve::factory()->forSchool($this->school)->create();
        $eleve2 = Eleve::factory()->forSchool($this->school)->create();
        $parent = UserParent::create(['user_id' => User::factory()->create(['role' => 'parent', 'ecole_id' => $this->school->id])->id]);
        $parent->setEleves([$eleve1->id]);

        $this->putJson('/api/parents/' . $parent->id, [
            'telephone' => '0197000000',
            'eleve_ids' => [$eleve2->id],
        ])->assertOk();

        $parent->refresh();
        $this->assertSame('0197000000', $parent->user->telephone);
        $this->assertTrue($parent->eleves()->where('eleves.id', $eleve2->id)->exists());
        $this->assertFalse($parent->eleves()->where('eleves.id', $eleve1->id)->exists());
    }

    /**
     * Run a closure as a user of another school so the tenant scope does not
     * hide a cross-school row during creation.
     */
    private function withoutTenantScope(Ecole $school, callable $callback)
    {
        $actor = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);
        $previous = auth()->user();
        $this->actingAs($actor);
        $result = $callback();
        if ($previous) {
            $this->actingAs($previous);
        }
        return $result;
    }
}
