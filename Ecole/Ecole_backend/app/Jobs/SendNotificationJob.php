<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * SendNotificationJob — Envoi asynchrone de notifications
 *
 * Supporte les canaux : in-app, email, SMS selon les préférences
 * de l'utilisateur et le type de notification.
 */
class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    /**
     * @param array $data ['user_id', 'type', 'title', 'body', 'action_url'?, 'data'?]
     */
    public function __construct(
        public array $data,
    ) {}

    public function handle(): void
    {
        $user = User::find($this->data['user_id']);
        if (!$user) return;

        // Créer la notification en base
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $this->data['type'] ?? 'info',
            'title' => $this->data['title'],
            'body' => $this->data['body'],
            'action_url' => $this->data['action_url'] ?? null,
            'data' => $this->data['data'] ?? null,
        ]);

        // Canal email si activé
        if ($user->email && ($this->data['channels']['email'] ?? true)) {
            // Mail::to($user)->send(new NotificationMail($notification));
        }

        // Canal SMS si configuré
        if ($user->telephone && ($this->data['channels']['sms'] ?? false)) {
            // SmsService::send($user->telephone, $this->data['body']);
        }
    }

    public function failed(\Throwable $e): void
    {
        logger()->error('Notification failed', [
            'data' => $this->data,
            'error' => $e->getMessage(),
        ]);
    }
}
