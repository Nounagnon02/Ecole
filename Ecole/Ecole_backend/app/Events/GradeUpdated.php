<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GradeUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Note $note,
        public string $action, // 'created' | 'updated' | 'deleted'
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('grades.' . $this->note->classe_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'grade.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->note->id,
            'eleve_id' => $this->note->eleve_id,
            'classe_id' => $this->note->classe_id,
            'matiere_id' => $this->note->matiere_id,
            'valeur' => $this->note->valeur,
            'action' => $this->action,
            'periode_id' => $this->note->periode_id,
            'created_at' => $this->note->created_at->toISOString(),
        ];
    }
}
