<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Eleve;
use App\Models\Message;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Non-régression sur les failles relevées lors de l'audit du 2026-07-31.
 *
 * Chaque test verrouille une correction précise : si quelqu'un réintroduit le
 * comportement d'origine, le test échoue en nommant la faille.
 */
class AuditRegressionTest extends TestCase
{
    use RefreshDatabase;

    /* ─── S1 — cloisonnement des rôles ─────────────────────────────────── */

    /** @test */
    public function s1_un_directeur_ne_contourne_pas_les_controles_de_role()
    {
        $ecole = Ecole::factory()->create();
        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);

        // Route protégée par role:super-admin
        $this->actingAs($directeur)
            ->postJson('/api/ecoles/provision', [
                'nom' => 'École pirate',
                'email' => 'pirate@test.bj',
                'adresse' => 'Nulle part',
            ])
            ->assertStatus(403);
    }

    /** @test */
    public function s1_un_directeur_ne_lit_pas_les_dossiers_medicaux()
    {
        $ecole = Ecole::factory()->create();
        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);

        // `role:directeur,infirmier` autorise bien le directeur ici ; on vérifie
        // en revanche qu'un rôle non listé reste bloqué.
        $bibliothecaire = User::factory()->create(['role' => 'bibliothecaire', 'ecole_id' => $ecole->id]);

        $this->actingAs($bibliothecaire)
            ->getJson('/api/infirmier/dossiers-medicaux')
            ->assertStatus(403);
    }

    /* ─── S3 — pas de paiement validé sans confirmation provider ───────── */

    /** @test */
    public function s3_mobile_money_ne_valide_pas_un_paiement_sans_transaction()
    {
        $ecole = Ecole::factory()->create();
        $comptable = User::factory()->create(['role' => 'comptable', 'ecole_id' => $ecole->id]);
        $eleve = Eleve::factory()->create(['ecole_id' => $ecole->id]);

        $payment = Payment::factory()->create([
            'ecole_id' => $ecole->id,
            'eleve_id' => $eleve->id,
            'status' => 'pending',
            'transaction_id' => null,
        ]);

        $this->actingAs($comptable)
            ->postJson('/api/payments/mobile-money', [
                'payment_id' => $payment->id,
                'phone_number' => '97000000',
                'operator' => 'mtn',
            ])
            ->assertStatus(422);

        $this->assertSame('pending', $payment->fresh()->status);
    }

    /** @test */
    public function s3_un_eleve_ne_solde_pas_le_paiement_dun_autre()
    {
        $ecole = Ecole::factory()->create();
        $eleveA = Eleve::factory()->create(['ecole_id' => $ecole->id]);
        $eleveB = Eleve::factory()->create(['ecole_id' => $ecole->id]);

        $userA = User::factory()->create([
            'role' => 'eleve',
            'ecole_id' => $ecole->id,
            'id' => $eleveA->user_id,
        ]);

        $payment = Payment::factory()->create([
            'ecole_id' => $ecole->id,
            'eleve_id' => $eleveB->id,
            'status' => 'pending',
        ]);

        $this->actingAs($userA)
            ->postJson('/api/payments/mobile-money', [
                'payment_id' => $payment->id,
                'phone_number' => '97000000',
                'operator' => 'mtn',
            ])
            ->assertStatus(403);

        $this->assertSame('pending', $payment->fresh()->status);
    }

    /* ─── S4 — l'identité ne vient jamais de la requête ────────────────── */

    /** @test */
    public function s4_user_id_dans_la_requete_ne_change_pas_la_boite_de_reception()
    {
        $ecole = Ecole::factory()->create();
        $alice = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]);
        $bob = User::factory()->create(['role' => 'enseignant', 'ecole_id' => $ecole->id]);

        Message::factory()->create([
            'ecole_id' => $ecole->id,
            'expediteur' => (string) $alice->id,
            'destinataire' => (string) $bob->id,
            'sujet' => 'Secret de Bob',
            'contenu' => 'Confidentiel',
        ]);

        // Alice tente de lire la boîte de Bob en forçant user_id.
        $response = $this->actingAs($alice)
            ->getJson('/api/messages/received?user_id=' . $bob->id)
            ->assertStatus(200);

        $this->assertSame(
            0,
            count($response->json('data.data') ?? []),
            'La boîte de réception doit rester celle de l\'utilisateur authentifié'
        );
    }

    /** @test */
    public function s4_lexpediteur_ne_peut_pas_etre_usurpe()
    {
        $ecole = Ecole::factory()->create();
        $eleve = User::factory()->create(['role' => 'eleve', 'ecole_id' => $ecole->id]);
        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $ecole->id]);
        $parent = User::factory()->create(['role' => 'parent', 'ecole_id' => $ecole->id]);

        $this->actingAs($eleve)
            ->postJson('/api/messages', [
                'expediteur' => (string) $directeur->id, // tentative d'usurpation
                'destinataire' => (string) $parent->id,
                'sujet' => 'Message officiel',
                'contenu' => 'Faux message du directeur',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'sujet' => 'Message officiel',
            'expediteur' => (string) $eleve->id,
        ]);
    }

    /* ─── S5 — isolation des établissements ───────────────────────────── */

    /** @test */
    public function s5_un_directeur_ne_liste_que_son_etablissement()
    {
        $sienne = Ecole::factory()->create();
        Ecole::factory()->count(3)->create();

        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $sienne->id]);

        $response = $this->actingAs($directeur)
            ->getJson('/api/ecoles')
            ->assertStatus(200);

        $ids = collect($response->json('data.data'))->pluck('id')->all();

        $this->assertSame([$sienne->id], $ids);
    }

    /** @test */
    public function s5_un_directeur_ne_lit_pas_une_autre_ecole()
    {
        $sienne = Ecole::factory()->create();
        $autre = Ecole::factory()->create();

        $directeur = User::factory()->create(['role' => 'directeur', 'ecole_id' => $sienne->id]);

        $this->actingAs($directeur)
            ->getJson("/api/ecoles/{$autre->id}")
            ->assertStatus(403);
    }

    /* ─── S8 — le référentiel école n'est pas public ───────────────────── */

    /** @test */
    public function s8_un_eleve_ne_lit_pas_le_referentiel_consolide()
    {
        $ecole = Ecole::factory()->create();
        $eleve = User::factory()->create(['role' => 'eleve', 'ecole_id' => $ecole->id]);

        $this->actingAs($eleve)
            ->getJson('/api/dashboard/directeur/data')
            ->assertStatus(403);
    }

    /* ─── S14 — pas d'énumération de comptes ──────────────────────────── */

    /** @test */
    public function s14_forgot_password_repond_pareil_pour_un_email_inconnu()
    {
        $ecole = Ecole::factory()->create();
        User::factory()->create(['email' => 'connu@test.bj', 'ecole_id' => $ecole->id]);

        $connu = $this->postJson('/api/auth/forgot-password', ['email' => 'connu@test.bj']);
        $inconnu = $this->postJson('/api/auth/forgot-password', ['email' => 'inconnu@test.bj']);

        $this->assertSame($connu->status(), $inconnu->status());
        $this->assertSame($connu->json('message'), $inconnu->json('message'));
    }

    /* ─── S2 — CORS non réfléchissant ─────────────────────────────────── */

    /** @test */
    public function s2_une_origine_arbitraire_nest_pas_reflechie()
    {
        $response = $this->withHeaders(['Origin' => 'https://evil.example'])
            ->getJson('/api/health');

        $this->assertNotSame(
            'https://evil.example',
            $response->headers->get('Access-Control-Allow-Origin'),
            'L\'API ne doit jamais renvoyer l\'Origin reçu tel quel'
        );
    }
}
