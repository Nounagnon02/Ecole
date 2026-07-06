<?php

namespace App\Events;

use App\Models\Message;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message,
        public User $sender,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('messages.' . $this->message->destinataire_id),
            new Channel('conversations.' . $this->message->conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'content' => $this->message->contenu,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->nom . ' ' . $this->sender->prenom,
            ],
            'created_at' => $this->message->created_at->toISOString(),
        ];
    }
}
