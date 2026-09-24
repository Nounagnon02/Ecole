<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Un `throttle:N,M` numérique compte sous une clé qui ne dépend que de
 * l'utilisateur, ou de l'IP pour un invité — ni de la route, ni de la limite
 * (ThrottleRequests::resolveRequestSignature). Sans troisième paramètre, toutes
 * les routes limitées ainsi partageaient donc un seul compteur : une limite
 * basse (5 imports de notes par minute, 3 demandes de réinitialisation par
 * minute) était consommée par le trafic de routes sans rapport. Trouvé par les
 * tests de charge (loadtests/README.md). Chaque limite a désormais son propre
 * compartiment : `throttle:5,1,notes-import`.
 */
class RateLimitBucketsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_teacher_who_just_browsed_the_grades_can_still_import_a_file()
    {
        $this->actingInSchool(role: 'enseignant');

        // Bien en dessous des 60 requêtes par minute du groupe `notes`.
        for ($i = 0; $i < 5; $i++) {
            $this->getJson('/api/notes/stats');
        }

        $this->assertNotSame(429, $this->postJson('/api/notes/import')->status());
    }

    /**
     * Une école entière sort souvent par une seule IP publique : les invités y
     * partagent le compteur de l'IP.
     *
     * @test
     */
    public function a_school_sharing_one_ip_can_still_request_a_password_reset_after_a_few_school_selections()
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/select-school', []);
        }

        $this->assertNotSame(
            429,
            $this->postJson('/api/auth/forgot-password', ['email' => 'parent@example.test'])->status()
        );
    }

    /** @test */
    public function each_limit_still_applies_within_its_own_bucket()
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/forgot-password', ['email' => 'parent@example.test']);
        }

        $this->postJson('/api/auth/forgot-password', ['email' => 'parent@example.test'])
            ->assertStatus(429);
    }

    /** @test */
    public function every_numeric_throttle_names_its_own_bucket()
    {
        $unnamed = collect(Route::getRoutes()->getRoutes())
            ->flatMap(fn ($route) => collect($route->gatherMiddleware())
                ->filter(fn ($middleware) => is_string($middleware)
                    && preg_match('/^throttle:\d+(,\d+)?$/', $middleware))
                ->map(fn ($middleware) => $route->uri() . ' ' . $middleware))
            ->unique()
            ->sort()
            ->values()
            ->all();

        $this->assertSame(
            [],
            $unnamed,
            "Limites sans compartiment (partagent le compteur de toutes les autres) :\n" . implode("\n", $unnamed)
        );
    }
}
