<?php

namespace Tests\Unit\Listeners;

use App\Listeners\AlertOnJobFailure;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * `app/Jobs/` compte 5 classes en `ShouldQueue`, dont un seul déclenché en
 * production réelle aujourd'hui (`ExportReportJob`) -- mais l'échec
 * définitif d'un job, quel qu'il soit, ne devait remonter nulle part avant
 * cet ajout : ni email, ni journal dédié, seulement `failed_jobs` (jamais
 * consulté sans alerte pour aller le voir).
 */
class AlertOnJobFailureTest extends TestCase
{
    /** @test */
    public function a_failed_job_is_reported_as_an_anomaly()
    {
        config(['alerting.mail_to' => null]);
        Log::spy();

        $job = \Mockery::mock(Job::class);
        $job->shouldReceive('resolveName')->andReturn('App\\Jobs\\ExportReportJob');
        $job->shouldReceive('getQueue')->andReturn('default');

        $event = new JobFailed('database', $job, new \Exception('Colonne inconnue'));

        (new AlertOnJobFailure())->handle($event);

        Log::shouldHaveReceived('critical')->withArgs(
            fn ($message, $context) => str_contains($message, 'Job en échec définitif')
                && $context['job'] === 'App\\Jobs\\ExportReportJob'
                && $context['exception'] === 'Colonne inconnue'
        )->once();
    }
}
