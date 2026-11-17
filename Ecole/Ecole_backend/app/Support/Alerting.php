<?php

namespace App\Support;

use App\Notifications\AnomalyDetected;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Point d'entrée unique pour signaler une anomalie (job en échec, webhook
 * rejeté...). Journalise toujours, quel que soit l'état de la config —
 * l'astreinte par email est un canal en plus, jamais le seul, pour qu'une
 * anomalie ne se perde pas silencieusement tant qu'`ALERT_EMAIL` n'est pas
 * renseigné (décision d'astreinte pas encore prise, comme pour les
 * sauvegardes et le stockage S3 ailleurs dans ce projet).
 */
class Alerting
{
    /**
     * @param array<string, mixed> $context
     */
    public static function anomaly(string $title, array $context = []): void
    {
        Log::critical("[Alerte] {$title}", $context);

        $recipient = config('alerting.mail_to');

        if (!$recipient) {
            return;
        }

        Notification::route('mail', $recipient)
            ->notify(new AnomalyDetected($title, $context));
    }
}
