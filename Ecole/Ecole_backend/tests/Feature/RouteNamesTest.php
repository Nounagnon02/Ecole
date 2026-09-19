<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * `php artisan route:cache` refuse de sérialiser deux routes qui portent le
 * même nom (LogicException « Another route has already been assigned name »).
 *
 * `routes/tenant.php` et `routes/api/universite.php` déclaraient chacun un
 * `apiResource` `matieres` et `notes` : dix noms en double. `railway.json`
 * (`route:cache && … serve`) et `.github/workflows/backend.yml` exécutent cette
 * commande — le service ne démarrait pas. Rien ne l'avait détecté parce que la
 * suite ne construit jamais le cache de routes.
 */
class RouteNamesTest extends TestCase
{
    /** @test */
    public function every_named_route_has_a_unique_name()
    {
        $duplicates = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->duplicates()
            ->unique()
            ->values()
            ->all();

        $this->assertSame(
            [],
            $duplicates,
            "Noms de route en double (route:cache échouera) : " . implode(', ', $duplicates)
        );
    }
}
