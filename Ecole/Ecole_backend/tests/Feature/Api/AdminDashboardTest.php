<?php

namespace Tests\Feature\Api;

use App\Models\Ecole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Contrat du dashboard admin (lot L4).
 *
 * Le front `/admin/dashboard` attend `stats` (6 cartes dans l'ordre),
 * `traffic` (7 jours), `health`, `logs` et `utilisateurs` — plus les clés
 * legacy conservées pour les autres consommateurs.
 */
class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_dashboard_returns_the_frontend_contract()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $admin = User::factory()->create(['role' => 'admin', 'ecole_id' => $school->id]);

        $this->actingAs($admin);

        $response = $this->getJson('/api/dashboard/admin');
        $response->assertStatus(200);

        $data = $response->json('data');

        // Les 6 cartes, dans l'ordre attendu par STATS_META du front.
        $this->assertCount(6, $data['stats']);
        $this->assertSame('Utilisateurs Actifs', $data['stats'][0]['title']);
        $this->assertSame('Requêtes/minute', $data['stats'][1]['title']);
        $this->assertSame('Espace Disque', $data['stats'][2]['title']);
        $this->assertSame('Erreurs API', $data['stats'][3]['title']);
        $this->assertSame('Temps Réponse', $data['stats'][4]['title']);
        $this->assertSame('Uptime', $data['stats'][5]['title']);

        // Temps de réponse réel, injecté après le cache.
        $this->assertMatchesRegularExpression('/\d+ ms/', $data['stats'][4]['value']);

        // Trafic sur 7 jours avec les clés du graphique.
        $this->assertCount(7, $data['traffic']);
        $this->assertArrayHasKey('jour', $data['traffic'][0]);
        $this->assertArrayHasKey('req', $data['traffic'][0]);
        $this->assertArrayHasKey('temps', $data['traffic'][0]);

        // Santé système.
        $this->assertNotEmpty($data['health']);
        foreach ($data['health'] as $item) {
            $this->assertArrayHasKey('label', $item);
            $this->assertArrayHasKey('value', $item);
            $this->assertArrayHasKey('width', $item);
            $this->assertArrayHasKey('color', $item);
        }

        // Logs et utilisateurs récents.
        $this->assertIsArray($data['logs']);
        $this->assertIsArray($data['utilisateurs']);

        // Clés legacy conservées.
        $this->assertIsArray($data['repartition_roles']);
        $this->assertSame(1, $data['ecoles']);
        $this->assertIsArray($data['activites_recentes']);
    }

    /** @test */
    public function directeur_cannot_access_the_admin_dashboard()
    {
        $school = Ecole::factory()->create(['status' => 'active']);
        $director = User::factory()->create(['role' => 'directeur', 'ecole_id' => $school->id]);

        $this->actingAs($director)
            ->getJson('/api/dashboard/admin')
            ->assertStatus(403);
    }
}
