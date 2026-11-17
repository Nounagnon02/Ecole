<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * `AssignCorrelationId` (premier middleware de la pile globale, voir
 * bootstrap/app.php) donne à chaque requête un identifiant qui doit se
 * retrouver à la fois dans l'en-tête de réponse (support, débogage manuel) et
 * dans le contexte des logs (`Log::withContext()`, sans toucher aux dizaines
 * de sites d'appel `Log::info()`/`Log::error()` existants).
 */
class CorrelationIdTest extends TestCase
{
    /** @test */
    public function the_request_id_header_is_a_valid_uuid()
    {
        $response = $this->getJson('/api/health');

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $response->headers->get('X-Request-Id')
        );
    }

    /** @test */
    public function a_client_supplied_request_id_is_honored_instead_of_generating_a_new_one()
    {
        $response = $this->getJson('/api/health', ['X-Request-Id' => 'from-the-client-123']);

        $response->assertHeader('X-Request-Id', 'from-the-client-123');
    }

    /** @test */
    public function two_requests_get_two_different_ids()
    {
        $first = $this->getJson('/api/health')->headers->get('X-Request-Id');
        $second = $this->getJson('/api/health')->headers->get('X-Request-Id');

        $this->assertNotSame($first, $second);
    }

    /**
     * `Log::withContext()` alimente `Log::sharedContext()` pour tout le reste
     * du cycle de requête — c'est le mécanisme qui fait qu'un `Log::info(...)`
     * ordinaire, n'importe où dans le contrôleur/service/job appelé, porte
     * `correlation_id` sans qu'on l'y ajoute explicitement. Vérifié via
     * `sharedContext()` juste après la requête plutôt qu'en interceptant un
     * fichier de log réel : plus rapide, et c'est exactement ce que consulte
     * le processeur Monolog qui écrit chaque ligne.
     *
     * @test
     */
    public function the_correlation_id_is_shared_into_the_log_context()
    {
        $response = $this->getJson('/api/health');

        $this->assertSame(
            $response->headers->get('X-Request-Id'),
            Log::sharedContext()['correlation_id'] ?? null
        );
    }
}
