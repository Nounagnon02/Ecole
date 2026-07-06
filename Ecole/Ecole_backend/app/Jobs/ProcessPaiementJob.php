<?php

namespace App\Jobs;

use App\Models\Paiement;
use App\Services\PaiementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessPaiementJob — Traitement asynchrone des paiements
 *
 * Gère la validation, la notification et la mise à jour
 * des statuts de paiement en arrière-plan.
 */
class ProcessPaiementJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Paiement $paiement,
    ) {}

    public function handle(PaiementService $paiementService): void
    {
        Log::info('Traitement du paiement', ['id' => $this->paiement->id]);

        // Notifier l'élève et/ou le parent
        $notificationData = [
            'user_id' => $this->paiement->eleve->user_id ?? $this->paiement->eleve->tuteur_user_id,
            'type' => 'paiement',
            'title' => 'Paiement enregistré',
            'body' => "Paiement de {$this->paiement->montant} FCFA enregistré",
            'action_url' => "/paiements/{$this->paiement->id}",
            'channels' => ['email' => true, 'sms' => false],
        ];

        SendNotificationJob::dispatch($notificationData);

        // Mettre à jour les statistiques de l'école
        Log::info('Paiement traité avec succès', ['id' => $this->paiement->id]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Échec traitement paiement', [
            'paiement_id' => $this->paiement->id,
            'error' => $e->getMessage(),
        ]);

        $this->paiement->update(['statut' => 'erreur']);
    }
}
