<?php

namespace Tests\Feature;

use Tests\TestCase;

class UniversityApiRouteTest extends TestCase
{
    /**
     * Test that the university API returns 401 without auth token.
     * All university routes are protected by Sanctum.
     */
    public function test_university_api_requires_authentication()
    {
        $endpoints = [
            '/api/universite/universites',
            '/api/universite/facultes',
            '/api/universite/departements',
            '/api/universite/filieres',
            '/api/universite/etudiants',
            '/api/universite/enseignants',
            '/api/universite/matieres',
            '/api/universite/notes',
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(401,
                "Expected 401 for {$endpoint}, got {$response->status()}"
            );
        }
    }

    /**
     * Test that the university API with invalid token returns 401.
     */
    public function test_university_api_with_invalid_token()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid_token_here',
        ])->getJson('/api/universite/universites');

        $response->assertStatus(401);
    }

    /**
     * Test that POST to connexion has proper JSON Content-Type.
     */
    public function test_connexion_endpoint_accepts_json()
    {
        $response = $this->postJson('/api/connexion', [
            'identifiant' => 'test',
            'password' => 'test',
        ]);

        // Should return 422 (validation) or 401 (wrong creds), not 415 (unsupported media type)
        $this->assertNotEquals(415, $response->status(),
            'Connexion endpoint rejected JSON content type'
        );
    }
}
