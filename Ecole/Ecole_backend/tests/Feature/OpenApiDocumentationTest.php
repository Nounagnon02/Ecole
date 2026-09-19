<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * La documentation OpenAPI (Scramble) n'a jamais été produite : deux défauts
 * de `config/scramble.php` la rendaient inexploitable, sans qu'aucun test ne
 * regarde le document généré.
 *
 * - `servers` était une liste de tableaux au lieu d'une table
 *   `description => url` : `scramble:export` levait une TypeError.
 * - `api_path` valait `docs/api` (l'URL de la page) au lieu du préfixe des
 *   routes à documenter : une fois le premier défaut levé, le document sortait
 *   avec zéro chemin.
 */
class OpenApiDocumentationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function the_openapi_document_is_generated_and_covers_the_api()
    {
        $path = tempnam(sys_get_temp_dir(), 'openapi_');

        try {
            $this->artisan('scramble:export', ['--path' => $path])->assertExitCode(0);
            $document = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } finally {
            @unlink($path);
        }

        $this->assertGreaterThan(100, count($document['paths']), 'Le document OpenAPI est vide ou quasi vide.');
        $this->assertNotEmpty($document['components']['schemas'] ?? []);
        $this->assertSame('Serveur principal', $document['servers'][0]['description'] ?? null);
    }
}
