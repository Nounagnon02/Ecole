<?php

namespace App\Jobs;

use App\Models\Note;
use App\Models\Classe;
use App\Models\Eleve;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * AIAnalysisJob — Analyse IA périodique des performances scolaires
 *
 * S'exécute automatiquement (cron) pour analyser :
 * - Performances par classe/matière
 * - Élèves en risque d'échec
 * - Tendances trimestrielles
 * - Recommandations pédagogiques
 */
class AIAnalysisJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 600;

    public function __construct(
        public ?int $classeId = null,
        public ?int $periodeId = null,
    ) {}

    public function handle(AIService $ai): void
    {
        Log::info('Démarrage analyse IA', [
            'classe_id' => $this->classeId,
            'periode_id' => $this->periodeId,
        ]);

        $classes = $this->classeId
            ? Classe::where('id', $this->classeId)->get()
            : Classe::all();

        foreach ($classes as $classe) {
            $this->analyzeClasse($classe, $ai);
        }

        Log::info('Analyse IA terminée');
    }

    protected function analyzeClasse(Classe $classe, AIService $ai): void
    {
        $eleves = $classe->eleves()->with(['notes' => function ($q) {
            if ($this->periodeId) $q->where('periode_id', $this->periodeId);
        }, 'notes.matiere'])->get();

        if ($eleves->isEmpty()) return;

        // Agréger les données pour l'analyse
        $stats = $eleves->map(fn($eleve) => [
            'nom' => $eleve->nom . ' ' . $eleve->prenom,
            'matricule' => $eleve->matricule,
            'moyenne' => round($eleve->notes->avg('valeur') ?? 0, 2),
            'notes_par_matiere' => $eleve->notes->groupBy('matiere.nom')
                ->map(fn($notes) => round($notes->avg('valeur'), 2))
                ->toArray(),
        ])->toArray();

        // Envoyer à l'IA pour analyse
        $result = $ai->analyseAcademicResults([
            'classe' => $classe->nom,
            'effectif' => $eleves->count(),
            'eleves' => $stats,
            'periode' => $this->periodeId ?? 'toutes',
        ]);

        // Sauvegarder les résultats d'analyse
        if ($result['success']) {
            $analysis = json_decode($result['content'], true);
            Log::info('Analyse IA classe', [
                'classe' => $classe->nom,
                'resultats' => $analysis,
            ]);

            // Stocker l'analyse dans une table dédiée ou un log
            activity()
                ->performedOn($classe)
                ->log('IA Analysis: ' . json_encode($analysis));
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error('AIAnalysisJob failed', [
            'classe_id' => $this->classeId,
            'error' => $e->getMessage(),
        ]);
    }
}
