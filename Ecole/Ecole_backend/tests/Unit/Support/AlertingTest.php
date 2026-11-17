<?php

namespace Tests\Unit\Support;

use App\Notifications\AnomalyDetected;
use App\Support\Alerting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * `Alerting::anomaly()` doit toujours journaliser (canal de secours tant
 * qu'`ALERT_EMAIL` n'est pas configuré — décision d'astreinte pas encore
 * prise), et envoyer en plus une notification par email dès qu'un
 * destinataire est configuré.
 */
class AlertingTest extends TestCase
{
    /** @test */
    public function it_always_logs_even_without_a_configured_recipient()
    {
        config(['alerting.mail_to' => null]);
        Log::spy();
        Notification::fake();

        Alerting::anomaly('Test sans destinataire', ['clef' => 'valeur']);

        Log::shouldHaveReceived('critical')->withArgs(
            fn ($message, $context) => str_contains($message, 'Test sans destinataire') && $context === ['clef' => 'valeur']
        )->once();
        Notification::assertNothingSent();
    }

    /** @test */
    public function it_notifies_the_configured_recipient_in_addition_to_logging()
    {
        config(['alerting.mail_to' => 'astreinte@ecole.test']);
        Log::spy();
        Notification::fake();

        Alerting::anomaly('Test avec destinataire', ['clef' => 'valeur']);

        Log::shouldHaveReceived('critical')->once();
        Notification::assertSentOnDemand(
            AnomalyDetected::class,
            fn ($notification, $channels, $notifiable) => in_array('astreinte@ecole.test', (array) ($notifiable->routes['mail'] ?? []), true)
        );
    }
}
