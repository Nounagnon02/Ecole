<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * ExportReportJob — Export asynchrone de rapports
 *
 * Génère des exports CSV/Excel/PDF en arrière-plan
 * et notifie l'utilisateur quand le fichier est prêt.
 */
class ExportReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 600;

    public function __construct(
        public User $user,
        public string $type,      // eleves, notes, paiements, bulletins
        public array $filters = [],
        public string $format = 'csv', // csv, xlsx, pdf
    ) {}

    public function handle(): void
    {
        $filename = "exports/{$this->type}_{$this->user->id}_{$this->user->ecole_id}.{$this->format}";

        // Logique d'export selon le type
        $data = match ($this->type) {
            'eleves' => $this->exportEleves(),
            'notes' => $this->exportNotes(),
            'paiements' => $this->exportPaiements(),
            default => throw new \InvalidArgumentException("Type d'export invalide: {$this->type}"),
        };

        Storage::disk('local')->put($filename, $data);

        // Notifier l'utilisateur que l'export est prêt
        SendNotificationJob::dispatch([
            'user_id' => $this->user->id,
            'type' => 'export',
            'title' => 'Export prêt',
            'body' => "L'export {$this->type} est prêt à être téléchargé.",
            'action_url' => "/exports/{$filename}",
            'channels' => ['email' => true, 'sms' => false],
        ]);

        Log::info('Export generated', [
            'user_id' => $this->user->id,
            'type' => $this->type,
            'filename' => $filename,
        ]);
    }

    protected function exportEleves(): string
    {
        // Implémentation CSV de base
        $eleves = \App\Models\Eleve::with('classe')
            ->when($this->filters['classe_id'] ?? null, fn($q, $id) => $q->where('classe_id', $id))
            ->get();

        $csv = "Matricule,Nom,Prénom,Classe,Sexe,Téléphone,Email\n";
        foreach ($eleves as $eleve) {
            $csv .= "{$eleve->matricule},{$eleve->nom},{$eleve->prenom},{$eleve->classe?->nom},{$eleve->sexe},{$eleve->telephone},{$eleve->email}\n";
        }

        return $csv;
    }

    protected function exportNotes(): string
    {
        $notes = \App\Models\Notes::with(['eleve.user', 'matiere'])
            ->when($this->filters['periode'] ?? null, fn($q, $p) => $q->where('periode', $p))
            ->when($this->filters['classe_id'] ?? null, fn($q, $id) => $q->where('classe_id', $id))
            ->get();

        $csv = "Élève,Matricule,Matière,Note,Période,Date\n";
        foreach ($notes as $note) {
            $csv .= "{$note->eleve?->user?->name} {$note->eleve?->user?->prenom},{$note->eleve?->numero_matricule},{$note->matiere?->nom},{$note->note},{$note->periode},{$note->date_evaluation}\n";
        }

        return $csv;
    }

    protected function exportPaiements(): string
    {
        $paiements = \App\Models\PaiementEleve::with('eleve')
            ->when($this->filters['date_debut'] ?? null, fn($q, $d) => $q->whereDate('date_paiement', '>=', $d))
            ->when($this->filters['date_fin'] ?? null, fn($q, $d) => $q->whereDate('date_paiement', '<=', $d))
            ->get();

        $csv = "Référence,Élève,Montant,Type,Mode,Date\n";
        foreach ($paiements as $p) {
            $csv .= "{$p->reference},{$p->eleve?->nom} {$p->eleve?->prenom},{$p->montant},{$p->type},{$p->mode_paiement},{$p->date_paiement}\n";
        }

        return $csv;
    }
}
