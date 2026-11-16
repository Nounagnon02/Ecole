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
        // Panne simulée sur la connexion par défaut, quel que soit le pilote :
        // fichier absent pour SQLite, port injoignable pour MySQL. Seul SQLite
        // était cassé, et le job `test-mysql` recevait 200 (R-47, 16/11/2026).
        $connexion = config('database.default');
        $origine = config("database.connections.$connexion");
        config(["database.connections.$connexion" => array_merge($origine, [
            'database' => $origine['driver'] === 'sqlite' ? '/chemin/qui/n/existe/pas.sqlite' : $origine['database'],
            'host' => '127.0.0.1',
            'port' => 1,
        ])]);
        // Forcer une nouvelle connexion : celle déjà ouverte resterait valide
        // sinon, le changement de config ne suffit pas seul.
        \Illuminate\Support\Facades\DB::purge($connexion);

        Log::spy();

        $response = $this->getJson('/api/health');

        // Connexion rétablie pour la suite (annulation de la transaction de test).
        config(["database.connections.$connexion" => $origine]);
        \Illuminate\Support\Facades\DB::purge($connexion);

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
