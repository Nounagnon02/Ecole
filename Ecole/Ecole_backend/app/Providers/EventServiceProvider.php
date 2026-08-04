<?php

namespace App\Providers;

use App\Support\CycleAccess;
use Illuminate\Auth\Events\Authenticated;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        // Le périmètre de cycle est mémoïsé par requête. Si l'identité change
        // dans le même processus PHP — `actingAs` entre deux assertions, un job
        // en file traitant plusieurs établissements, un worker Octane qui
        // enchaîne les requêtes — le second appelant héritait du cycle du
        // premier. Le cache devenait lui-même la fuite qu'il devait éviter.
        //
        // `Authenticated` couvre les deux cas : il est émis quand le garde
        // résout l'utilisateur d'une requête, et aussi par `setUser()`, donc
        // par `actingAs`.
        Event::listen(Authenticated::class, fn() => CycleAccess::flush());
        Event::listen(Logout::class, fn() => CycleAccess::flush());

        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     *
     * @return bool
     */
    public function shouldDiscoverEvents()
    {
        return false;
    }
}
