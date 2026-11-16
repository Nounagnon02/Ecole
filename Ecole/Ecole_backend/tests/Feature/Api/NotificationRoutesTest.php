<?php

namespace Tests\Feature\Api;

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * `NotificationController::store()` laissait n'importe quel compte connecté
 * envoyer une notification de contenu libre à n'importe quel utilisateur de la
 * plateforme (`exists:users,id` interroge une table que `BelongsToEcole` ne
 * couvre pas). Elle n'était routée que par `routes/tenant.php`, inatteignable
 * tant qu'aucun sous-domaine n'est provisionné — mais aucun client ne
 * l'appelait, donc elle a été retirée plutôt que durcie.
 */
class NotificationRoutesTest extends TestCase
{
    /** @test */
    public function no_route_lets_a_user_create_a_notification_for_someone_else()
    {
        $stores = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_ends_with($route->getActionName(), 'NotificationController@store'));

        $this->assertCount(0, $stores, 'Une route expose encore NotificationController@store.');
        $this->assertFalse(method_exists(NotificationController::class, 'store'));
    }

    /** @test */
    public function reading_notifications_is_still_routed_on_both_surfaces()
    {
        $indexes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_ends_with($route->getActionName(), 'NotificationController@index'));

        $this->assertGreaterThanOrEqual(2, $indexes->count());
    }
}
