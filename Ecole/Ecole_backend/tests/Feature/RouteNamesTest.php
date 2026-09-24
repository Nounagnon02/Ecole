<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * `php artisan route:cache` refuse deux routes de même nom (« Another route
 * has already been assigned name [...] ») et s'arrête. Or c'est l'optimisation
 * standard de production : `railway.json` (startCommand) l'enchaîne avec `&&`
 * avant `artisan serve`, donc une seule collision de nom empêche le serveur de
 * démarrer. Le déploiement SSH de `backend.yml` la lance aussi, sur une ligne
 * à part : là, les routes restent simplement non mises en cache, sans erreur
 * visible.
 *
 * Les tests n'appellent jamais `route:cache`, et aucune route n'est jamais
 * générée par nom ici (les URL sont écrites en dur côté SPA) : la collision
 * `matieres.*` / `notes.*` — l'API tenant de `routes/tenant.php` contre le
 * module université — est restée invisible jusqu'à ce qu'un test de charge
 * tente d'optimiser l'image de production.
 */
class RouteNamesTest extends TestCase
{
    /** @test */
    public function every_named_route_has_a_unique_name()
    {
        $duplicated = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->countBy()
            ->filter(fn (int $count) => $count > 1)
            ->keys()
            ->sort()
            ->values()
            ->all();

        $this->assertSame(
            [],
            $duplicated,
            'Noms de route dupliqués (route:cache échouerait) : ' . implode(', ', $duplicated)
        );
    }
}
