<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\Eleve;
use App\Models\Notes;
use App\Models\Absence;
use App\Models\PaiementEleve;
use App\Models\Classes;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_has_fillable_attributes()
    {
        $user = new User();

        $this->assertContains('name', $user->getFillable());
        $this->assertContains('email', $user->getFillable());
        $this->assertContains('password', $user->getFillable());
        $this->assertContains('role', $user->getFillable());
    }

    /** @test */
    public function user_password_is_hashed()
    {
        $user = User::factory()->create([
            'password' => 'plain-text-password',
        ]);

        $this->assertNotEquals('plain-text-password', $user->password);
        $this->assertTrue(password_verify('plain-text-password', $user->password));
    }

    /** @test */
    public function user_can_be_created_with_valid_role()
    {
        $user = User::factory()->create([
            'role' => 'enseignant',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'enseignant',
        ]);
    }

    /** @test */
    public function user_has_relations()
    {
        $user = new User();

        $this->assertTrue(method_exists($user, 'eleve'));
        $this->assertTrue(method_exists($user, 'enseignant'));
        $this->assertTrue(method_exists($user, 'parent'));
    }

    /** @test */
    public function eleve_belongs_to_classe()
    {
        // Le scope tenant a besoin d'un utilisateur authentifié, sans quoi
        // toute requête renvoie un ensemble vide (cf. actingInSchool).
        $school = $this->actingInSchool();
        $classe = Classes::factory()->create(['ecole_id' => $school->id]);
        // La colonne est `class_id`, pas `classe_id`.
        $eleve = Eleve::factory()->forSchool($school)->create(['class_id' => $classe->id]);

        $this->assertInstanceOf(Classes::class, $eleve->classe);
        $this->assertEquals($classe->id, $eleve->classe->id);
    }

    /** @test */
    public function note_belongs_to_eleve()
    {
        $school = $this->actingInSchool();
        $eleve = Eleve::factory()->forSchool($school)->create();
        $note = Notes::factory()->create([
            'eleve_id' => $eleve->id,
            'ecole_id' => $school->id,
        ]);

        $this->assertInstanceOf(Eleve::class, $note->eleve);
        $this->assertEquals($eleve->id, $note->eleve->id);
    }

    /** @test */
    public function absence_belongs_to_eleve()
    {
        $school = $this->actingInSchool();
        $eleve = Eleve::factory()->forSchool($school)->create();
        $absence = Absence::factory()->create([
            'eleve_id' => $eleve->id,
            'ecole_id' => $school->id,
        ]);

        $this->assertInstanceOf(Eleve::class, $absence->eleve);
        $this->assertEquals($eleve->id, $absence->eleve->id);
    }
}
