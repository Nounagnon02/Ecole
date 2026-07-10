<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public string $resetUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $resetUrl)
    {
        $this->resetUrl = $resetUrl;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $appName = config('app.name', 'École');

        return (new MailMessage)
            ->subject("Réinitialisation de votre mot de passe {$appName}")
            ->greeting("Bonjour {$notifiable->prenom} {$notifiable->name},")
            ->line("Vous recevez cet email car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.")
            ->action('Réinitialiser mon mot de passe', $this->resetUrl)
            ->line('Ce lien de réinitialisation expirera dans 60 minutes.')
            ->line("Si vous n'avez pas demandé cette réinitialisation, aucune action n'est requise.")
            ->salutation("L'équipe {$appName}");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'reset_url' => $this->resetUrl,
        ];
    }
}
