<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Contrat messagerie interne.
 *
 * La page Messagerie lit `GET /messages/conversations` et attend par
 * conversation : un identifiant stable (`id`), le nom du contact, son rôle,
 * l'aperçu du dernier message (`dernier_message`) et le compte non lu.
 * L'aperçu manquait — le front affichait « Aucun message » partout — et le
 * rôle manquait aussi, donc le sous-titre tombait sur « Utilisateur ».
 *
 * Les notifications passaient par `DB::table`, court-circuitant le scope
 * BelongsToEcole : un utilisateur pouvait lire les notifications d'un autre
 * établissement. Elles passent désormais par le modèle.
 */
class MessagesContractTest extends TestCase
{
    use RefreshDatabase;

    private Ecole $school;
    private User $me;
    private User $contact;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = Ecole::factory()->create(['status' => 'active']);

        $this->me = User::factory()->create([
            'role' => 'directeur',
            'ecole_id' => $this->school->id,
            'is_active' => true,
        ]);

        $this->contact = User::factory()->create([
            'role' => 'enseignant',
            'ecole_id' => $this->school->id,
            'is_active' => true,
            'prenom' => 'Aminata',
            'name' => 'Diallo',
        ]);

        $this->actingAs($this->me);
    }

    private function send(int $from, int $to, string $contenu, bool $lu = false, ?string $createdAt = null): Message
    {
        return Message::create([
            'ecole_id' => $this->school->id,
            'expediteur' => (string) $from,
            'destinataire' => (string) $to,
            'sujet' => '(sans objet)',
            'contenu' => $contenu,
            'lu' => $lu,
            'created_at' => $createdAt ?? now(),
            'updated_at' => now(),
        ]);
    }

    /** @test */
    public function each_conversation_carries_preview_role_and_stable_id()
    {
        // Un non lu du contact, puis une réponse de ma part : le dernier
        // message du fil est celui du contact (le plus récent au moment de
        // la requête est le « Bonjour Directeur » envoyé en second ?) —
        // non, ma réponse est postérieure ; le dernier message est donc
        // « Bonjour Amin, à demain ».
        $this->send($this->contact->id, $this->me->id, 'Bonjour Directeur', lu: false, createdAt: '2026-08-06 09:00:00');
        $this->send($this->me->id, $this->contact->id, 'Bonjour Amin, à demain', createdAt: '2026-08-07 09:00:00');

        $items = $this->getJson('/api/messages/conversations')->assertOk()->json('data');

        $this->assertCount(1, $items);

        $conversation = $items[0];
        $this->assertSame($this->contact->id, $conversation['id']);
        $this->assertSame($this->contact->id, $conversation['contact_id']);
        $this->assertSame('Aminata Diallo', $conversation['contact_nom']);
        $this->assertSame('enseignant', $conversation['role']);
        $this->assertSame('Bonjour Amin, à demain', $conversation['dernier_message']);
        $this->assertSame(1, $conversation['non_lus']);
        $this->assertArrayHasKey('derniere_date', $conversation);
    }

    /** @test */
    public function a_long_preview_message_is_truncated()
    {
        $long = str_repeat('Messagerie scolaire. ', 40);
        $this->send($this->contact->id, $this->me->id, $long);

        $conversation = $this->getJson('/api/messages/conversations')->json('data')[0];

        $this->assertStringEndsWith('…', $conversation['dernier_message']);
        $this->assertLessThanOrEqual(121, mb_strlen($conversation['dernier_message']));
    }

    /** @test */
    public function opening_a_conversation_marks_only_messages_received_from_the_contact()
    {
        // Deux messages reçus du contact, un envoyé par moi.
        $contactMsgId = $this->send($this->contact->id, $this->me->id, 'Non lu 1')->id;
        $this->send($this->contact->id, $this->me->id, 'Non lu 2');
        $myMsgId = $this->send($this->me->id, $this->contact->id, 'Ma réponse')->id;

        $response = $this->putJson('/api/messages/conversation/' . $this->contact->id . '/read')->assertOk();

        $this->assertSame(2, $response->json('data.marked'));
        $this->assertDatabaseHas('messages', ['id' => $contactMsgId, 'lu' => true]);

        // Mon propre message n'est pas touché.
        $this->assertDatabaseHas('messages', ['id' => $myMsgId, 'lu' => false]);
    }

    /** @test */
    public function a_recipient_from_another_school_is_refused()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $stranger = User::factory()->create(['ecole_id' => $otherSchool->id, 'is_active' => true]);

        $this->postJson('/api/messages', [
            'destinataire' => $stranger->id,
            'contenu' => 'Hello',
        ])->assertStatus(422);

        $this->assertDatabaseCount('messages', 0);
    }

    /** @test */
    public function contacts_only_include_active_contacts_of_the_same_school()
    {
        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $inactive = User::factory()->create(['ecole_id' => $this->school->id, 'is_active' => false]);
        $stranger = User::factory()->create(['ecole_id' => $otherSchool->id, 'is_active' => true]);

        $items = $this->getJson('/api/messages/contacts')->assertOk()->json('data');

        $this->assertCount(1, $items);
        $this->assertSame($this->contact->id, $items[0]['id']);
        $this->assertSame('enseignant', $items[0]['role']);
        $this->assertNotContains($inactive->id, array_column($items, 'id'));
        $this->assertNotContains($stranger->id, array_column($items, 'id'));
    }

    /** @test */
    public function the_thread_enriches_sender_and_recipient_names()
    {
        $this->send($this->contact->id, $this->me->id, 'Bonjour Directeur');
        $this->send($this->me->id, $this->contact->id, 'Bonjour Amin');

        $items = $this->getJson('/api/messages/conversation/' . $this->contact->id)->json('data.data');

        $this->assertCount(2, $items);
        $this->assertSame('Aminata Diallo', $items[0]['expediteur_nom']);

        // Les deux sens du fil sont enrichis.
        $meNom = trim($this->me->prenom . ' ' . $this->me->name);
        $this->assertSame($meNom, $items[0]['destinataire_nom']);
        $this->assertSame($meNom, $items[1]['expediteur_nom']);
        $this->assertSame('Aminata Diallo', $items[1]['destinataire_nom']);
    }

    /** @test */
    public function notifications_are_scoped_to_the_establishment()
    {
        $mine = Notification::create([
            'user_id' => $this->me->id,
            'type' => 'info',
            'titre' => 'Mon annonce',
            'message' => 'Voir la suite',
            'lu' => false,
            'ecole_id' => $this->school->id,
        ]);

        $otherSchool = Ecole::factory()->create(['status' => 'active']);
        $foreign = Notification::create([
            'user_id' => $this->me->id,
            'type' => 'info',
            'titre' => 'Intrusion',
            'message' => 'Ne doit pas apparaître',
            'lu' => false,
            'ecole_id' => $otherSchool->id,
        ]);

        $items = $this->getJson('/api/notifications')->assertOk()->json('data');

        $this->assertCount(1, $items);
        $this->assertSame('Mon annonce', $items[0]['titre']);

        $this->putJson('/api/notifications/' . $mine->id . '/read')->assertOk();

        // La notification d'un autre établissement, même adressée à moi,
        // reste inchangée : le scope école empêche l'update.
        $this->assertSame(0, (int) DB::table('notifications')->where('id', $foreign->id)->value('lu'));
    }
}