<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

/**
 * `GET /docs/api.json` (Scramble) sert le client TypeScript généré et la page
 * de doc elle-même. `RestrictedDocsAccess` ne laisse passer que
 * l'environnement `local` ou un Gate `viewApiDocs` -- jamais défini nulle
 * part dans l'app -- donc en environnement `testing` (celui de `phpunit.xml`)
 * la route répond 403 avant même d'atteindre le générateur : ce test bascule
 * explicitement en environnement `local` pour exercer le vrai chemin, sinon
 * cette route est untestable par la suite normale et un bug dans le
 * générateur ne serait jamais vu ici (exactement le point aveugle décrit
 * dans l'audit pour le webhook et les jobs : l'environnement de test ne
 * traverse pas le même chemin que la production).
 */
class ApiDocumentationTest extends TestCase
{
    /** @test */
    public function the_openapi_document_generates_successfully()
    {
        $this->app['env'] = 'local';

        $response = $this->getJson('/docs/api.json');

        $response->assertOk();
        $response->assertJsonStructure(['openapi', 'info', 'paths', 'servers']);

        // `api_path: 'docs/api'` (l'ancienne valeur) ne correspondait à
        // aucune route réelle (toutes vivent sous `api/*`) : la génération ne
        // levait aucune erreur mais produisait un document sans une seule
        // route. Un simple `assertOk()` n'aurait rien vu.
        $paths = $response->json('paths');
        $this->assertIsArray($paths);
        $this->assertGreaterThan(
            50,
            count($paths),
            'La doc doit couvrir un nombre substantiel des routes réelles de l\'API.'
        );

        // `info.title` n'est pas la clé lue par le générateur (c'est
        // `ui.title`) : mal placée, elle retombe silencieusement sur
        // config('app.name').
        $this->assertSame(
            'École API — Système de Gestion Scolaire',
            $response->json('info.title'),
            'Le titre configuré doit apparaître, pas le nom générique de l\'application.'
        );
    }
}
