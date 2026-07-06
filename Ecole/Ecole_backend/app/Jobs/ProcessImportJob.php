<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessImportJob — Import asynchrone de données
 *
 * Traite les imports CSV/Excel en arrière-plan :
 * validation des lignes, import progressif, rapport d'erreurs.
 */
class ProcessImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 600;

    public function __construct(
        public User $user,
        public string $type,  // eleves, notes, utilisateurs
        public array $data,   // Données parsées du fichier
    ) {}

    public function handle(): void
    {
        $imported = 0;
        $errors = [];

        foreach ($this->data as $index => $row) {
            try {
                $this->processRow($row);
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Ligne " . ($index + 2) . " : " . $e->getMessage();
            }
        }

        $message = "Import {$this->type} terminé : {$imported} lignes importées";
        if (count($errors) > 0) {
            $message .= ", " . count($errors) . " erreurs";
        }

        SendNotificationJob::dispatch([
            'user_id' => $this->user->id,
            'type' => 'import',
            'title' => 'Import terminé',
            'body' => $message,
            'data' => ['imported' => $imported, 'errors' => $errors, 'type' => $this->type],
        ]);

        Log::info('Import processed', [
            'user_id' => $this->user->id,
            'type' => $this->type,
            'imported' => $imported,
            'errors' => count($errors),
        ]);
    }

    protected function processRow(array $row): void
    {
        match ($this->type) {
            'eleves' => $this->importEleve($row),
            'notes' => $this->importNote($row),
            default => throw new \InvalidArgumentException("Type d'import invalide"),
        };
    }

    protected function importEleve(array $row): void
    {
        // Validation et création d'élève
        \App\Models\Eleve::create([
            'nom' => $row['nom'],
            'prenom' => $row['prenom'],
            'date_naissance' => $row['date_naissance'],
            'sexe' => $row['sexe'],
            'matricule' => $row['matricule'],
            'classe_id' => $row['classe_id'],
            'email' => $row['email'] ?? null,
            'telephone' => $row['telephone'] ?? null,
        ]);
    }

    protected function importNote(array $row): void
    {
        \App\Models\Note::create([
            'eleve_id' => $row['eleve_id'],
            'matiere_id' => $row['matiere_id'],
            'valeur' => $row['valeur'],
            'periode_id' => $row['periode_id'] ?? null,
            'date' => $row['date'] ?? now(),
        ]);
    }
}
