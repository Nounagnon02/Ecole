<?php

namespace App\Events;

use App\Models\PaiementEleve;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaiementConfirmed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public PaiementEleve $paiement,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new Channel('notifications.' . $this->paiement->eleve->user_id),
        ];

        if ($this->paiement->parent_id) {
            $channels[] = new Channel('notifications.' . $this->paiement->parent_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'paiement.confirmed';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->paiement->id,
            'eleve_id' => $this->paiement->eleve_id,
            'montant' => (float) $this->paiement->montant,
            'type' => $this->paiement->type,
            'mode' => $this->paiement->mode,
            'reference' => $this->paiement->reference,
            'statut' => $this->paiement->statut,
            'created_at' => $this->paiement->created_at->toISOString(),
        ];
    }
}
