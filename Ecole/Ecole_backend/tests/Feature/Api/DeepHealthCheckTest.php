<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * `/api/health` répondait `{status: 'UP'}` en dur, sans jamais interroger la
 * DB, le cache ou la file — un load balancer pouvait le croire sain pendant
 * une panne complète. Chaque test ici force une dépendance précise en échec
 * (config invalide) et vérifie que la sonde le reflète, sans jamais exposer
 * le détail de l'exception dans la réponse elle-même (elle est publique, non
 * authentifiée).
 */
class DeepHealthCheckTest extends TestCase
{
    /** @test */
    public function reports_up_with_per_dependency_detail_when_everything_works()
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJson(['status' => 'UP'])
            ->assertJsonPath('checks.database', 'UP')
            ->assertJsonPath('checks.cache', 'UP')
            ->assertJsonPath('checks.queue', 'UP');
    }

    /** @test */
    public function reports_down_with_503_when_the_database_is_unreachable()
    {
        config(['database.connections.sqlite.database' => '/chemin/qui/n/existe/pas.sqlite']);
        // Forcer une nouvelle connexion : celle déjà ouverte sur `:memory:`
        // resterait valide sinon, le changement de config ne suffit pas seul.
        \Illuminate\Support\Facades\DB::purge('sqlite');

        Log::spy();

        $response = $this->getJson('/api/health');

        $response->assertStatus(503)
            ->assertJson(['status' => 'DOWN'])
            ->assertJsonPath('checks.database', 'DOWN');

        // Le détail de la panne va dans les logs, jamais dans la réponse
        // publique.
        $this->assertStringNotContainsString('/chemin/qui/n/existe/pas.sqlite', $response->getContent());
        Log::shouldHaveReceived('error')->withArgs(
            fn ($message) => str_contains($message, 'Base de données')
        )->once();
    }

    /** @test */
    public function reports_down_when_the_configured_queue_database_table_is_missing()
    {
        config(['queue.default' => 'database']);
        \Illuminate\Support\Facades\Schema::dropIfExists('jobs');

        $response = $this->getJson('/api/health');

        $response->assertStatus(503)->assertJsonPath('checks.queue', 'DOWN');
    }

    /** @test */
    public function a_sync_queue_is_always_reported_up_without_being_probed()
    {
        config(['queue.default' => 'sync']);

        $this->getJson('/api/health')->assertJsonPath('checks.queue', 'UP');
    }
}
