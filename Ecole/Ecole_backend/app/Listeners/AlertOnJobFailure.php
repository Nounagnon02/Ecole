<?php

namespace App\Listeners;

use App\Support\Alerting;
use Illuminate\Queue\Events\JobFailed;

class AlertOnJobFailure
{
    public function handle(JobFailed $event): void
    {
        Alerting::anomaly('Job en échec définitif', [
            'connection' => $event->connectionName,
            'job' => $event->job->resolveName(),
            'queue' => $event->job->getQueue(),
            'exception' => $event->exception->getMessage(),
        ]);
    }
}
