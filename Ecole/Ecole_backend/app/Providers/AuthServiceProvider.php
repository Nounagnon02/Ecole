<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Notes;
use App\Models\Absence;
use App\Models\Communication;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use App\Models\Universite\Devoir as UniversiteDevoir;
use App\Policies\NotePolicy;
use App\Policies\AbsencePolicy;
use App\Policies\CommunicationPolicy;
use App\Policies\ElevePolicy;
use App\Policies\PaiementPolicy;
use App\Policies\Universite\DevoirPolicy as UniversiteDevoirPolicy;

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
        Communication::class => CommunicationPolicy::class,

        // Registered explicitly rather than left to Laravel's convention:
        // policy auto-discovery looks for `App\Policies\Universite\DevoirPolicy`
        // for `App\Models\Universite\Devoir`, but the scholastic `App\Models\Devoir`
        // has no policy at all, so a silent miss here would read as "no policy
        // needed" instead of "policy not found".
        UniversiteDevoir::class => UniversiteDevoirPolicy::class,
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
