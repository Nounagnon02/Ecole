<?php

namespace Tests\Feature\Security;

use App\Models\Classes;
use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * CVE-2026-48019 (GHSA-5vg9-5847-vvmq) — injection CRLF dans la règle `email`
 * de Laravel, corrigée en 12.60.0.
 *
 * RFC 5322 autorise un CRLF suivi d'un espace (« folding whitespace ») à
 * l'intérieur d'une chaîne quotée ou d'un commentaire. Avant le correctif, la
 * règle `email` acceptait de telles adresses ; passées à un en-tête `To:`, le
 * CRLF permet d'ajouter un `Bcc:` arbitraire et de détourner l'envoi.
 *
 * Ces tests échouent sous Laravel 11.55 (les adresses passent la validation)
 * et réussissent sous Laravel 12.69. Ils couvrent les entrées qui acceptent un
 * email, en premier lieu celles qui déclenchent un envoi (invitation parent,
 * mot de passe oublié).
 */
class EmailCrlfInjectionTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private const PAYLOADS = [
        'quoted-local-part' => "\"a\r\n Bcc: attaquant@evil.test\"@example.com",
        'domain-comment' => "victime@(\r\n Bcc: attaquant@evil.test)example.com",
    ];

    private Ecole $school;
    private User $directeur;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Notification::fake();

        $this->school = Ecole::factory()->create(['status' => 'active']);
        $this->directeur = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
        ]);
    }

    /**
     * @param  array<string, callable(string): \Illuminate\Testing\TestResponse>  $endpoints
     */
    private function assertEveryEndpointRejects(array $endpoints): void
    {
        $failures = [];

        foreach ($endpoints as $name => $call) {
            foreach (self::PAYLOADS as $label => $email) {
                $response = $call($email);
                $errors = $response->json('errors') ?? [];

                if ($response->getStatusCode() !== 422 || !array_key_exists('email', $errors)) {
                    $failures[] = "{$name} [{$label}] → HTTP {$response->getStatusCode()}";
                }
            }
        }

        $this->assertSame([], $failures, "Adresses CRLF acceptées :\n" . implode("\n", $failures));
    }

    /** @test */
    public function public_endpoints_reject_an_address_carrying_a_crlf()
    {
        $this->assertEveryEndpointRejects([
            'POST /api/auth/forgot-password' => fn (string $email) => $this->postJson('/api/auth/forgot-password', [
                'email' => $email,
            ]),
        ]);

        Mail::assertNothingSent();
        Mail::assertNothingQueued();
        Notification::assertNothingSent();
    }

    /** @test */
    public function director_endpoints_reject_an_address_carrying_a_crlf()
    {
        $classe = Classes::factory()->create(['ecole_id' => $this->school->id]);
        $eleve = Eleve::factory()->forSchool($this->school)->create();
        $n = 0;

        $this->actingAs($this->directeur);

        $this->assertEveryEndpointRejects([
            'POST /api/parents/invite' => fn (string $email) => $this->postJson('/api/parents/invite', [
                'email' => $email,
                'eleve_id' => $eleve->id,
            ]),
            'POST /api/inscription' => fn (string $email) => $this->postJson('/api/inscription', [
                'name' => 'Kouassi', 'prenom' => 'Aya', 'role' => 'comptable',
                'identifiant' => 'CRLF-INS-' . ++$n, 'password' => 'motdepasse123',
                'ecole_id' => $this->school->id, 'email' => $email,
            ]),
            'POST /api/enseignants/store' => fn (string $email) => $this->postJson('/api/enseignants/store', [
                'name' => 'Agossou', 'prenom' => 'Paul', 'role' => 'enseignant',
                'identifiant' => 'CRLF-ENS-' . ++$n, 'password' => 'motdepasse123',
                'email' => $email,
            ]),
            'POST /api/parents' => fn (string $email) => $this->postJson('/api/parents', [
                'name' => 'Adjovi', 'prenom' => 'Rose',
                'identifiant' => 'CRLF-PAR-' . ++$n, 'password' => 'motdepasse123',
                'email' => $email,
            ]),
            'POST /api/eleves/store' => fn (string $email) => $this->postJson('/api/eleves/store', [
                'name' => 'Dossou', 'prenom' => 'Marie',
                'identifiant' => 'CRLF-ELE-' . ++$n, 'password' => 'motdepasse123',
                'numero_matricule' => 'CRLF-MAT-' . ++$n, 'classe_id' => $classe->id,
                'email' => $email,
            ]),
            'PUT /api/auth/profile' => fn (string $email) => $this->putJson('/api/auth/profile', [
                'email' => $email,
            ]),
        ]);

        Mail::assertNothingSent();
        Mail::assertNothingQueued();
        $this->assertSame(0, User::where('email', 'like', '%evil.test%')->count());
    }

    /**
     * Garde-fou contre le sur-blocage : le correctif ne doit refuser que les
     * CRLF, pas les adresses quotées légitimes ni les adresses ordinaires.
     *
     * @test
     */
    public function legitimate_addresses_are_still_accepted()
    {
        foreach (['parent@example.com', '"john doe"@example.com', 'prenom.nom+ecole@sous.domaine.bj'] as $email) {
            $this->assertTrue(
                Validator::make(['email' => $email], ['email' => 'required|email'])->passes(),
                "L'adresse légitime {$email} est rejetée."
            );
        }

        $eleve = Eleve::factory()->forSchool($this->school)->create();

        $this->actingAs($this->directeur)->postJson('/api/parents/invite', [
            'email' => 'papa@ecole.bj',
            'eleve_id' => $eleve->id,
        ])->assertStatus(201);
    }
}
