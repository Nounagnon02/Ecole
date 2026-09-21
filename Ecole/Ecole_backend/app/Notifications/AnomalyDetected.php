<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification générique pour toute anomalie détectée automatiquement
 * (job en échec, webhook rejeté...). Envoyée par adresse à la demande
 * (`Notification::route('mail', ...)`), pas à un `User` — le destinataire
 * est une astreinte, pas un compte de l'application.
 *
 * En file (`ShouldQueue`) : un SMTP indisponible ne doit pas faire échouer
 * la requête HTTP qui a détecté l'anomalie (le job en échec ou le webhook
 * rejeté sont déjà journalisés à ce stade, l'email est un canal en plus) ni
 * se perdre pour autant -- `$tries`/`backoff()` laissent la file de Laravel
 * réessayer l'envoi lui-même.
 */
class AnomalyDetected extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    /**
     * @param array<string, mixed> $context
     */
    public function __construct(
        private readonly string $title,
        private readonly array $context = [],
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name', 'École');

        $message = (new MailMessage)
            ->subject("[{$appName}] Anomalie détectée : {$this->title}")
            ->greeting('Anomalie détectée')
            ->line($this->title);

        foreach ($this->context as $key => $value) {
            $message->line("**{$key}** : " . (is_scalar($value) ? (string) $value : json_encode($value)));
        }

        return $message;
    }
}
