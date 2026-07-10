<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Notes;
use App\Models\Absence;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Policies\NotePolicy;
use App\Policies\AbsencePolicy;
use App\Policies\ElevePolicy;
use App\Policies\PaiementPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Notes::class => NotePolicy::class,
        Absence::class => AbsencePolicy::class,
        Eleve::class => ElevePolicy::class,
        PaiementEleve::class => PaiementPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        //
    }
}
